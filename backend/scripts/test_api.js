const axios = require('axios');

async function testPredictionApi() {
    try {
        const url = 'http://localhost:5000/api/v1/mandi/predictions?crop=Wheat&state=All%20India&days=7';
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);
        console.log('Success:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testPredictionApi();
