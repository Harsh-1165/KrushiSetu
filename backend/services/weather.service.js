/**
 * Mock Weather Service
 * Simulates fetching weather data based on location for demo purposes.
 * In production, this would connect to OpenWeatherMap or similar APIs.
 */

const getMockWeather = (location) => {
    // Deterministic "random" based on location string length to ensure consistency
    const seed = location.length;

    // Simulate different climates based on location name just for fun/demo variety
    let baseTemp = 25;
    let baseHum = 60;

    if (location.toLowerCase().includes('north') || location.toLowerCase().includes('delhi')) {
        baseTemp = 35;
        baseHum = 40;
    } else if (location.toLowerCase().includes('south') || location.toLowerCase().includes('kerala')) {
        baseTemp = 28;
        baseHum = 85;
    } else if (location.toLowerCase().includes('mumbai') || location.toLowerCase().includes('coast')) {
        baseTemp = 30;
        baseHum = 90;
    }

    // Add some noise
    const temp = baseTemp + (seed % 5);
    const humidity = Math.min(100, Math.max(0, baseHum + (seed % 20) - 10));

    // Determine rain likelihood
    const isRainy = humidity > 80 || (seed % 3 === 0);
    const rainMm = isRainy ? (seed % 50) + 5 : 0;

    // Generate forecast text
    let forecast = "Sunny and clear skies.";
    if (isRainy) forecast = "Heavy rainfall expected in next 24 hours.";
    else if (humidity > 70) forecast = "Cloudy with high humidity.";
    else if (temp > 35) forecast = "Heatwave conditions expected.";

    return {
        temperature: temp,
        humidity: humidity,
        rainfall: rainMm,
        forecast: forecast,
        retrievedAt: new Date()
    };
};

module.exports = { getMockWeather };
