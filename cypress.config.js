const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    specPattern: "cypress/integration/**/*.spec.js",
    supportFile: false,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'chrome') {
          // Prevent sandbox and GPU crashes on Windows / Node v24
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });
    }
  },
  allowCypressEnv: false
});
