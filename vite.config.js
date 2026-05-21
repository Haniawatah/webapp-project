const { defineConfig } = require("vite");


const resolvedBasePath = process.env.VITE_BASE_PATH || "./";


// relative base path keeps GitHub Pages and local preview behavior aligned.
module.exports = defineConfig({
  base: resolvedBasePath
});
