// background.js — Chrome Extension Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('DOGE Wallet installed! Much Wow. Very Crypto. 🐕');
});

// Keep service worker alive for storage operations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ type: 'pong' });
  }
  return true;
});
