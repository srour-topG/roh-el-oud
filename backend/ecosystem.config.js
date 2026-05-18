require('dotenv').config(); // Load .env variables

module.exports = {
  apps: [
    {
      name: "cardio",
      script: "./server.js", // or index.js — your main file
      env: {
        HOST: process.env.HOST,
        PASSWORD: process.env.PASSWORD,
        DATABASE: process.env.DATABASE,
        USER: process.env.USER,
        JWT_SECRET: process.env.JWT_SECRET,
        NODE_ENV: "production"
      }
    }
  ]
};
