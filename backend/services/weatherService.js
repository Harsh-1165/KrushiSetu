const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Service: Weather Data Fetcher
 * Fetches current weather and forecast from OpenWeatherMap
 */
const getWeatherData = async (lat, lng) => {
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            logger.warn("Weather API Key missing in .env");
            return null;
        }

        if (!lat || !lng) {
            logger.warn("Latitude or Longitude missing for weather data");
            return null;
        }

        // Fetch Current Weather
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

        logger.info(`Fetching weather for: ${lat}, ${lng}`);
        const response = await axios.get(url);
        const data = response.data;

        // Extract relevant data
        return {
            temp: data.main.temp,
            humidity: data.main.humidity,
            condition: data.weather[0].main,
            description: data.weather[0].description,
            windSpeed: data.wind.speed,
            location: data.name
        };

    } catch (error) {
        logger.error("Weather API Error:", error.message);
        return null; // Return null gracefully so the rest of the app doesn't crash
    }
};

module.exports = {
    getWeatherData
};
