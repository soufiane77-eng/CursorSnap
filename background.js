'use strict';

// Sauvegarde le JSON capturé : chrome.storage.local + fichier dans Downloads.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'save') {
    saveJson(msg.id, msg.json)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // réponse asynchrone
  }
});

async function saveJson(id, json) {
  // 1. Stockage local (utilisé par l'historique du popup)
  await chrome.storage.local.set({ [id]: json });
  // 2. Fichier sur disque : ~/Downloads/cursor-inspector/<id>.json
  const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  await chrome.downloads.download({
    url: url,
    filename: 'cursor-inspector/' + id + '.json',
    saveAs: false,
    conflictAction: 'uniquify',
  });
}