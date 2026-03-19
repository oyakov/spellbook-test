import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 80;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://unpkg.com"],
            "worker-src": ["'self'", "blob:", "https://unpkg.com"],
            "connect-src": ["'self'", "https://houndy-southwestwardly-anastasia.ngrok-free.dev", "http://localhost:1234", "blob:", "https://unpkg.com"]
        }
    }
}));

// Trust first proxy (Nginx)
app.set('trust proxy', 1);

// RAG Architecture Note:
// Current vector store is in-memory on the frontend for privacy and local-first compliance.
// For production scale, consider a persistent vector store (e.g., Supabase / Pinecone).
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // Default 15 mins
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100');
const LOGIN_LIMIT_WINDOW = parseInt(process.env.LOGIN_LIMIT_WINDOW_MS || '900000');
const LOGIN_LIMIT_MAX = parseInt(process.env.LOGIN_LIMIT_MAX || '10');

const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: LOGIN_LIMIT_WINDOW,
    max: LOGIN_LIMIT_MAX,
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting setup
app.use('/api/', limiter);
// app.use('/api/login', loginLimiter); // Uncomment to enable login rate limiting

// Restricted CORS
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.PUBLIC_URL || 'https://37.1.197.100', 'https://localhost', 'http://localhost'] 
    : ['http://localhost:5173', 'http://localhost:8888', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or matching origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'spellbook-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Password management
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;

if (!LOGIN_PASSWORD) {
    console.error('CRITICAL: LOGIN_PASSWORD not set in environment. Application exiting.');
    process.exit(1);
}

const HASHED_PASSWORD = bcrypt.hashSync(LOGIN_PASSWORD.trim(), 10);

// Auth Middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Initialize Gemini with default key
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Define System Instruction
const systemInstruction = `You are Spellbook, a premium AI legal assistant. Be concise, professional, and helpful. 
You have access to user-uploaded documents and a library of standard templates (including images and audio briefings). 
When answering, prioritize the provided document context if relevant. 
Always maintain a premium, high-end persona.
When referencing a document, use the format [doc:Source Name] to create a clickable link.`;

// Helper to get Gemini model
const getGeminiModel = (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey || DEFAULT_API_KEY);
    return genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction,
    });
};

const getGeminiEmbeddingModel = (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey || DEFAULT_API_KEY);
    return genAI.getGenerativeModel({
        model: 'gemini-embedding-001',
    });
};

// Auth Endpoints
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    console.log(`Login request received`);
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }

    const match = await bcrypt.compare(password.trim(), HASHED_PASSWORD);
    if (match) {
        req.session.authenticated = true;
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', (req, res) => {
    if (req.session.authenticated) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// Chat Endpoint (Protected)
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, history, provider, apiKey } = req.body;
        console.log(`Received ${provider || 'gemini'} chat request: "${message?.substring(0, 50)}..."`);

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let responseText = '';
        let fallbackOccurred = false;

        if (provider === 'lmstudio') {
            try {
                const response = await fetch('http://localhost:1234/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'model-identifier', // LM Studio usually ignores this or uses the loaded model
                        messages: [
                            { role: 'system', content: systemInstruction },
                            ...(history || []).map(m => ({ 
                                role: m.role === 'assistant' ? 'assistant' : 'user', 
                                content: m.text 
                            })),
                            { role: 'user', content: message }
                        ],
                        temperature: 0.7,
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`LM Studio error: ${response.status} ${JSON.stringify(errData)}`);
                }

                const data = await response.json();
                return res.json({ text: data.choices[0].message.content });
            } catch (err) {
                console.warn('LM Studio failed, falling back to Gemini:', err.message);
                fallbackOccurred = true;
            }
        }

        // Default: Gemini
        const currentKey = apiKey || DEFAULT_API_KEY;
        if (!currentKey) {
            return res.status(401).json({ 
                error: fallbackOccurred 
                    ? 'LM Studio failed and Gemini API Key is missing. Please set it in Settings.' 
                    : 'Gemini API Key is missing. Please set it in Settings.' 
            });
        }

        const model = getGeminiModel(currentKey);
        const formattedHistory = (history || []).map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        const chatSession = model.startChat({ history: formattedHistory });
        const result = await chatSession.sendMessage(message);
        responseText = result.response.text();

        res.json({ 
            text: responseText, 
            fallback: fallbackOccurred,
            provider: 'gemini' 
        });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
});

// Embedding Endpoint (Protected)
app.post('/api/embed', requireAuth, async (req, res) => {
    try {
        const { input, provider, apiKey } = req.body;
        console.log(`Received ${provider || 'gemini'} embedding request`);

        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        if (provider === 'lmstudio') {
            const response = await fetch('http://localhost:1234/v1/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input,
                    model: 'model-identifier'
                })
            });

            if (!response.ok) {
                throw new Error(`LM Studio Embedding error: ${response.status}`);
            }

            const data = await response.json();
            return res.json({ data: [{ embedding: data.data[0].embedding }] });
        }

        // Default: Gemini
        const currentKey = apiKey || DEFAULT_API_KEY;
        if (!currentKey) {
            return res.status(401).json({ error: 'Gemini API Key is missing for embeddings.' });
        }

        const embeddingModel = getGeminiEmbeddingModel(currentKey);
        const result = await embeddingModel.embedContent(input);
        const embedding = result.embedding.values;

        res.json({
            data: [{ embedding }]
        });
    } catch (error) {
        console.error('Embedding API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate embedding' });
    }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve library files (Protected)
app.use('/library', requireAuth, express.static(path.join(__dirname, 'public', 'library')));

// Library Management Endpoints (Protected)
app.get('/api/library', requireAuth, async (req, res) => {
    try {
        const libraryPath = path.join(__dirname, 'public', 'library');
        const files = await fs.readdir(libraryPath);
        // Filter out hidden files
        res.json(files.filter(f => !f.startsWith('.')));
    } catch (error) {
        console.error('Error reading library directory:', error);
        res.status(500).json({ error: 'Failed to read library documents' });
    }
});

app.post('/api/library', requireAuth, async (req, res) => {
    try {
        const { filename, base64 } = req.body;
        if (!filename || !base64) {
            return res.status(400).json({ error: 'Filename and base64 content are required' });
        }
        
        // Sanitize filename to prevent path traversal
        const safeFilename = path.basename(filename);
        if (safeFilename !== filename) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        // Remove data URI prefix if present
        const base64Data = base64.replace(/^data:.*,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const publicPath = path.join(__dirname, 'public', 'library', safeFilename);
        const distPath = path.join(__dirname, 'dist', 'library', safeFilename);
        
        await fs.writeFile(publicPath, buffer);
        await fs.writeFile(distPath, buffer).catch(() => console.warn('dist/library not ready'));
        
        res.json({ message: 'File saved successfully', filename: safeFilename });
    } catch (error) {
        console.error('Error saving library file:', error);
        res.status(500).json({ error: 'Failed to save library file' });
    }
});

app.delete('/api/library/:filename', requireAuth, async (req, res) => {
    try {
        const { filename } = req.params;
        const safeFilename = path.basename(filename);
        if (safeFilename !== filename) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const publicPath = path.join(__dirname, 'public', 'library', safeFilename);
        const distPath = path.join(__dirname, 'dist', 'library', safeFilename);
        
        await fs.unlink(publicPath).catch(() => console.warn('File not in public/library'));
        await fs.unlink(distPath).catch(() => console.warn('File not in dist/library'));
        
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting library file:', error);
        res.status(500).json({ error: 'Failed to delete library file' });
    }
});

// Fallback to index.html for SPA routing
// n8n Automation Endpoint (Protected)
app.post('/api/n8n', requireAuth, async (req, res) => {
    try {
        const { message } = req.body;
        console.log(`Forwarding to n8n: "${message?.substring(0, 50)}..."`);

        if (!process.env.N8N_WEBHOOK_URL) {
            return res.status(500).json({ error: 'N8N_WEBHOOK_URL not configured' });
        }

        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: message }),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('n8n API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
