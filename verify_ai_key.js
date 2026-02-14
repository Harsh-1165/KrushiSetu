require('dotenv').config({ path: './backend/.env' });
const OpenAI = require('openai');

async function verifyKey() {
    console.log("Loading .env from ./backend/.env");
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
        console.error("❌ ERROR: OPENAI_API_KEY is not found in process.env");
        return;
    }

    if (key === 'mock-key' || key.startsWith('sk-mock')) {
        console.error("❌ ERROR: OPENAI_API_KEY appears to be a mock key.");
        return;
    }

    console.log(`✅ Key found: ${key.substring(0, 3)}...${key.substring(key.length - 4)}`);

    const openai = new OpenAI({ apiKey: key });

    try {
        console.log("Testing connection to OpenAI...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Ping" }],
            model: "gpt-3.5-turbo",
        });
        console.log("✅ OpenAPI Connection Successful!");
        console.log("Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ OpenAI API Call Failed:", error.message);
    }
}

verifyKey();
