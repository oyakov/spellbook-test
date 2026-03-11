import { GoogleGenerativeAI } from "@google/generative-ai";

async function testKey() {
    const API_KEY = "AIzaSyAsNuXEqJpwfmd5JAaPwIt4OUAEh0o2z8s";
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent("Explain an indemnification clause briefly as a legal expert.");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("FULL ERROR:", error);
    }
}

testKey();
