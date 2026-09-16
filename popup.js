(() => {
  'use strict';

  const btn = document.getElementById('start-btn');
  const status = document.getElementById('status');
  const historyList = document.getElementById('history-list');

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

  // ===== Historique des JSON sauvegardés =====
  async function loadHistory() {
    const all = await chrome.storage.local.get(null);
    const entries = Object.entries(all)
      .filter(([k]) => k.startsWith('ci-'))
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10);

    historyList.innerHTML = '';
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'Aucun élément capturé';
      historyList.appendChild(empty);
      return;
    }

    for (const [id, json] of entries) {
      const row = document.createElement('div');
      row.className = 'history-row';

      let label = id;
      try {
        const data = JSON.parse(json);
        label = id + ' — ' + data.element.tag;
        if (data.element.text) {
          label += ' «' + data.element.text.slice(0, 20) + '»';
        }
      } catch (e) {
        /* JSON invalide : on affiche l'ID seul */
      }

      const span = document.createElement('span');
      span.textContent = label;
      span.title = json;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'history-copy';
      copyBtn.textContent = 'Copier';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(json);
          copyBtn.textContent = '✓';
          setTimeout(() => (copyBtn.textContent = 'Copier'), 1000);
        } catch (err) {
          copyBtn.textContent = '✗';
        }
      });

      row.appendChild(span);
      row.appendChild(copyBtn);
      historyList.appendChild(row);
    }
  }

  loadHistory();
})();