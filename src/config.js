
require('dotenv').config();

const config = {
    OPENWEATHER_KEY: process.env.OPENWEATHER_KEY,
    API_KEY: process.env.API_KEY,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    PORT: Number(process.env.PORT) || 3000
};

module.exports = config;
