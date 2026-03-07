const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('diamondDraft', {
  platform: process.platform,
  isDesktop: true,
  version: require('./package.json').version,
});