(() => {
  'use strict';

  const btn = document.getElementById('start-btn');
  const status = document.getElementById('status');

  btn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      status.textContent = 'Aucun onglet actif';
      return;
    }
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'start' });
      window.close();
    } catch (err) {
      status.textContent = 'Rechargez la page';
    }
  });
})();