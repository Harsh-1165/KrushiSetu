
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in Node 18+

async function testMandiList() {
    try {
        console.log("Testing GET /api/v1/mandi/list...");
        const response = await fetch('http://localhost:5000/api/v1/mandi/list?limit=10');

        if (!response.ok) {
            console.error(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Body:", text);
            return;
        }

        const data = await response.json();
        console.log("Success:", data.success);
        console.log("Source:", data.source);
        console.log("Count:", data.count);
        if (data.data && data.data.length > 0) {
            console.log("First Mandi:", JSON.stringify(data.data[0], null, 2));
        } else {
            console.log("No data returned");
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testMandiList();
