/* ----------------------------------------------------
   app.js
   Main coordinator: tab switching, modal close,
   export/import, init everything.
----------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // ----- Bulletproof modal hide/show (bypasses CSS caching issues) -----
  // Inline styles always beat external CSS, so we force display directly.
  document.querySelectorAll('.modal').forEach(modal => {
    // Force-hide on load no matter what CSS says
    modal.style.display = 'none';
    modal.removeAttribute('hidden');

    // Watch for code elsewhere setting .hidden — sync the inline display
    new MutationObserver(() => {
      modal.style.display = modal.hasAttribute('hidden') ? 'none' : 'flex';
    }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  });

  // ----- Tab switching -----
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');

      // re-render the tab being shown (so charts size correctly)
      if (target === 'food') FoodLog.render();
      if (target === 'weight') WeightTab.render();
      if (target === 'water') WaterTab.render();
    });
  });

  // ----- Modal close buttons -----
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById(el.dataset.close).hidden = true;
    });
  });
  // close modal on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.hidden = true;
    });
  });

  // ----- Export -----
  document.getElementById('exportBtn').addEventListener('click', () => {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-log-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ----- Import -----
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const mode = confirm(
        'Import data?\n\n' +
        'OK = MERGE with existing data (keeps both)\n' +
        'Cancel = REPLACE all existing data (wipes current)'
      ) ? 'merge' : 'replace';
      if (mode === 'replace' && !confirm('Really replace all existing data? This cannot be undone.')) {
        e.target.value = '';
        return;
      }
      Storage.importAll(data, mode);
      alert('Import complete!');
      FoodLog.render();
      WeightTab.render();
      WaterTab.render();
    } catch (err) {
      console.error(err);
      alert('Invalid file: ' + err.message);
    }
    e.target.value = '';
  });

  // ----- Init each module -----
  FoodLog.init();
  WeightTab.init();
  WaterTab.init();
});
