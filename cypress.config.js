const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    specPattern: "cypress/integration/**/*.spec.js",
    supportFile: false
  },
});
