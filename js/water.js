/* ----------------------------------------------------
   water.js
   Water intake tracking with daily goal + 7-day chart.
----------------------------------------------------- */

const WaterTab = (() => {
  let chartInstance = null;
  const $ = (id) => document.getElementById(id);

  function init() {
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        Storage.addWater(amount);
        render();
      });
    });

    $('addCustomWaterBtn').addEventListener('click', () => {
      const amt = parseInt($('customWater').value);
      if (!amt || amt < 1) return;
      Storage.addWater(amt);
      $('customWater').value = '';
      render();
    });

    $('editGoalBtn').addEventListener('click', () => {
      const current = Storage.getSetting('waterGoal', 2500);
      const n = prompt('Daily water goal (ml):', current);
      if (n && !isNaN(parseInt(n))) {
        Storage.setSetting('waterGoal', parseInt(n));
        render();
      }
    });

    render();
  }

  function render() {
    const today = formatDate(new Date());
    const total = Storage.getWaterTotal(today);
    const goal = Storage.getSetting('waterGoal', 2500);
    const pct = Math.min(100, Math.round((total / goal) * 100));

    $('waterToday').textContent = total;
    $('waterGoal').textContent = goal;
    $('waterFill').style.width = pct + '%';
    $('waterPercent').textContent = pct + '%';

    renderChart();
    renderList();
  }

  function renderChart() {
    const data = Storage.getWaterByDay(7);
    const goal = Storage.getSetting('waterGoal', 2500);
    const ctx = $('waterChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => {
          const date = new Date(d.date + 'T00:00:00');
          return date.toLocaleDateString(undefined, { weekday: 'short' });
        }),
        datasets: [{
          label: 'ml',
          data: data.map(d => d.total),
          backgroundColor: data.map(d => d.total >= goal ? '#6b8c5a' : '#5d8aa8'),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2520',
            bodyFont: { family: 'JetBrains Mono', size: 13 },
            callbacks: { label: (c) => `${c.parsed.y} ml` },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(217, 210, 196, 0.5)' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 10 },
              color: '#6b6358',
              callback: (v) => v + 'ml',
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              color: '#6b6358',
            },
          },
        },
      },
    });
  }

  function renderList() {
    const today = formatDate(new Date());
    const entries = Storage.getWater(today).reverse();
    const list = $('waterList');
    if (entries.length === 0) {
      list.innerHTML = `<div class="empty-state">No water logged yet today.</div>`;
      return;
    }
    list.innerHTML = entries.map(e => `
      <div class="log-item">
        <div class="log-info">
          <div class="log-name" style="font-family:var(--font-mono);font-size:13px;">${e.time}</div>
        </div>
        <div class="log-cal" style="color:var(--water);">${e.amount}<small style="font-size:10px;font-family:var(--font-mono);color:var(--ink-faint);"> ml</small></div>
        <button class="log-delete" data-id="${e.id}">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.log-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.deleteWater(parseInt(btn.dataset.id));
        render();
      });
    });
  }

  return { init, render };
})();
