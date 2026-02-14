require('dotenv').config({ path: './backend/.env' });
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("🔍 Testing Dual AI Configuration...");

async function testOpenAI() {
    console.log("\n--------- OpenAI Test ---------");
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY is missing in backend/.env");
        return;
    }
    console.log(`🔑 Key found: ...${process.env.OPENAI_API_KEY.slice(-4)}`);

    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Use cheaper model for test
            messages: [{ role: "user", content: "Say 'OpenAI is working!'" }],
        });
        console.log("✅ Success:", response.choices[0].message.content);
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

async function testGemini() {
    console.log("\n--------- Gemini Test ---------");
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing in backend/.env");
        return;
    }
    console.log(`🔑 Key found: ...${process.env.GEMINI_API_KEY.slice(-4)}`);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'Gemini is working!'");
        console.log("✅ Success:", result.response.text());
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

(async () => {
    await testOpenAI();
    await testGemini();
    console.log("\n-------------------------------");
})();
