import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    const API_KEY = "AIzaSyAsNuXEqJpwfmd5JAaPwIt4OUAEh0o2z8s";
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        // The SDK might not have a direct listModels, but we can try a different approach or just test common ones
        const commonModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("Hi");
                console.log(`Model ${modelName} is AVAILABLE`);
            } catch (e) {
                console.log(`Model ${modelName} is NOT available: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
