import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
    const API_KEY = "AIzaSyAsNuXEqJpwfmd5JAaPwIt4OUAEh0o2z8s";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

main();
