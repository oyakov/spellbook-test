# Spellbook | AI Legal Assistant

✨ **Spellbook** is a premium, high-end AI legal assistant designed to help legal professionals review contracts, draft clauses, and manage legal documents with ease.

![Spellbook UI](screenshots/app_overview.png)

## Key Features

- 💬 **Professional Legal Chat**: Tailored AI persona for legal queries.
- 📚 **Legal Template Library**: Pre-loaded templates (text, images, and audio briefings) for quick reference.
- 📁 **RAG-Powered Document Analysis**: Upload PDFs and text files to provide context for the AI.
- 🏷️ **Smart Mentions**: Use `@mention` to explicitly reference specific documents or templates in your chat.
- 🤖 **Multi-Provider Support**: Seamlessly switch between Google Gemini (Cloud) and LM Studio (Local).
- 🔗 **n8n Integration**: Forward complex tasks to automation workflows using the `/n8n` prefix.
- 🔒 **Enterprise-Grade Security**: Session-based authentication, rate limiting, and professional security headers (Helmet).
- 🐳 **Dockerized Deployment**: Ready for production with a multi-stage Dockerfile and Nginx reverse proxy with SSL.

## Technical Stack

- **Frontend**: Vite, TypeScript, Vanilla CSS (Premium Design).
- **Backend**: Node.js, Express.
- **AI/LLM**: Google Generative AI (Gemini), PDF.js for document processing.
- **Infrastucture**: Docker, Nginx (Reverse Proxy + SSL).

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for containerized execution)
- Google Gemini API Key

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd spellbook-test
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your keys:

   ```bash
   cp .env.example .env
   ```

4. Generate local SSL certificates (Windows):

   ```powershell
   ./nginx/certs/generate-certs.ps1
   ```

### Running Locally

**Development Mode:**

```bash
npm run dev
```

**Production Mode (Express Server):**

```bash
npm run build
npm start
```

### Running with Docker

```bash
docker-compose up --build -d
```

Access the app at `https://localhost`.

## Architecture Note: RAG & Persistence

The current implementation uses an **in-memory vector store** on the frontend for privacy and speed. 

- **User Uploads**: Context is maintained for the duration of the session. Refreshing the page will clear uploaded document context.
- **Library Templates**: Automatically re-indexed on every login to ensure context is available.

*For production scaling, integration with a vector database (e.g., Supabase Vector or Pinecone) is recommended.*

## Testing

Run the full E2E test suite with Playwright:

```bash
npm run test:local
```

---
*Developed as a technical showcase for modern AI application architecture.*
