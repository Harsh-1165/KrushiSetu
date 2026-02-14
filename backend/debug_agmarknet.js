
const https = require('https');
const path = require('path');
const fs = require('fs');

// Simple .env parser since we might not have dotenv installed or want to rely on it
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            });
        }
    } catch (e) {
        console.error("Error loading .env:", e);
    }
}

loadEnv();

const apiKey = process.env.AGMARKET_API_KEY;
console.log("API Key loaded:", apiKey ? (apiKey.substring(0, 5) + "...") : "MISSING");

if (!apiKey) {
    console.error("ERROR: No API Key found in .env");
    process.exit(1);
}

const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=5`;

console.log("Fetching from:", url);

https.get(url, (res) => {
    let data = '';

    console.log("Status Code:", res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Response JSON Keys:", Object.keys(json));
            if (json.records) {
                console.log("Records Count:", json.records.length);
                if (json.records.length > 0) {
                    console.log("First Record Sample:", JSON.stringify(json.records[0], null, 2));
                }
            } else {
                console.log("No records field found. Full response:", data.substring(0, 500));
            }
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            console.log("Raw Response:", data.substring(0, 500));
        }
    });

}).on("error", (err) => {
    console.error("Error: " + err.message);
});
