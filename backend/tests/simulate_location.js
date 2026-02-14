
const fetch = require('node-fetch');

async function testLocationSearch() {
    // Coordinates for Surat, Gujarat
    const lat = 21.2388;
    const lng = 72.8712;
    const radius = 100;

    console.log(`\n--- Testing Location Search (Surat: ${lat}, ${lng}) ---`);

    const url = `http://localhost:5000/api/v1/mandi/list?lat=${lat}&lng=${lng}&radius=${radius}`;
    console.log(`GET ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Success: ${data.success}`);
        console.log(`Source: ${data.source}`);
        console.log(`Count: ${data.count}`);

        if (data.data && data.data.length > 0) {
            console.log("First 3 Results:");
            data.data.slice(0, 3).forEach(m => {
                console.log(`- ${m.name} (${m.district}, ${m.state}) [Dist: ${m.distance ? m.distance.toFixed(1) : 'N/A'} km]`);
            });
        } else {
            console.log("No mandis found.");
        }
    } catch (error) {
        console.error("Request Failed:", error);
    }
}

testLocationSearch();
