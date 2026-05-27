/* ----------------------------------------------------
   weight.js
   Weight + body data tracking with line chart.
----------------------------------------------------- */

const WeightTab = (() => {
  let chartInstance = null;
  let currentRange = 'week';
  const $ = (id) => document.getElementById(id);

  function init() {
    $('addWeightBtn').addEventListener('click', openModal);
    $('saveWeightBtn').addEventListener('click', saveWeight);

    document.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        renderChart();
      });
    });

    render();
  }

  function openModal() {
    const today = formatDate(new Date());
    const existing = Storage.getWeights().find(e => e.date === today);
    $('wtWeight').value = existing?.weight || '';
    $('wtBodyFat').value = existing?.bodyFat || '';
    $('wtWaist').value = existing?.waist || '';
    $('wtSleep').value = existing?.sleep || '';
    $('wtEnergy').value = existing?.energy || '';
    $('wtExercise').value = existing?.exercise || '';
    $('wtSteps').value = existing?.steps || '';
    $('wtNotes').value = existing?.notes || '';
    $('weightModal').hidden = false;
  }

  function saveWeight() {
    const w = parseFloat($('wtWeight').value);
    if (!w || w < 20 || w > 300) {
      alert('Please enter a valid weight (kg)');
      return;
    }
    const entry = {
      date: formatDate(new Date()),
      weight: w,
      bodyFat: parseFloat($('wtBodyFat').value) || null,
      waist: parseFloat($('wtWaist').value) || null,
      sleep: parseFloat($('wtSleep').value) || null,
      energy: parseInt($('wtEnergy').value) || null,
      exercise: parseInt($('wtExercise').value) || null,
      steps: parseInt($('wtSteps').value) || null,
      notes: $('wtNotes').value.trim(),
    };
    Storage.addWeight(entry);
    $('weightModal').hidden = true;
    render();
  }

  function render() {
    const weights = Storage.getWeights();

    // summary
    if (weights.length === 0) {
      $('latestWeight').textContent = '—';
      $('weekChange').textContent = '—';
    } else {
      const latest = weights[weights.length - 1];
      $('latestWeight').textContent = latest.weight.toFixed(1);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = formatDate(weekAgo);
      const oldEntry = [...weights].reverse().find(e => e.date <= weekAgoStr);
      if (oldEntry) {
        const change = latest.weight - oldEntry.weight;
        const sign = change > 0 ? '+' : '';
        $('weekChange').textContent = sign + change.toFixed(1);
        $('weekChange').style.color = change > 0.3 ? 'var(--danger)' :
                                        change < -0.3 ? 'var(--success)' : 'var(--ink)';
      } else {
        $('weekChange').textContent = '—';
      }
    }

    renderChart();
    renderList();
  }

  function getRangeData() {
    const weights = Storage.getWeights();
    if (weights.length === 0) return [];

    if (currentRange === 'all') return weights;

    const days = currentRange === 'week' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = formatDate(cutoff);
    return weights.filter(e => e.date >= cutoffStr);
  }

  function renderChart() {
    const data = getRangeData();
    const ctx = $('weightChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    if (data.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = 'italic 14px Fraunces, serif';
      ctx.fillStyle = '#9a9183';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet — log your weight to see the trend.',
        ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(e => {
          const d = new Date(e.date + 'T00:00:00');
          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Weight (kg)',
          data: data.map(e => e.weight),
          borderColor: '#b85d3e',
          backgroundColor: 'rgba(184, 93, 62, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#b85d3e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#2a2520',
            titleFont: { family: 'Geist', size: 12 },
            bodyFont: { family: 'JetBrains Mono', size: 13 },
            padding: 10,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(1)} kg`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(217, 210, 196, 0.5)' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              color: '#6b6358',
              callback: (v) => v + ' kg',
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'JetBrains Mono', size: 10 },
              color: '#9a9183',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
        },
      },
    });
  }

  function renderList() {
    const weights = Storage.getWeights();
    const list = $('weightList');
    if (weights.length === 0) {
      list.innerHTML = `<div class="empty-state">No entries yet.</div>`;
      return;
    }
    // most recent first
    const sorted = [...weights].reverse().slice(0, 30);
    list.innerHTML = sorted.map(e => `
      <div class="log-item">
        <div class="log-info">
          <div class="log-name">${prettyDate(e.date)}</div>
          <div class="log-meta">
            ${e.bodyFat ? `<span>BF ${e.bodyFat}%</span>` : ''}
            ${e.waist ? `<span>Waist ${e.waist}cm</span>` : ''}
            ${e.sleep ? `<span>😴 ${e.sleep}h</span>` : ''}
            ${e.energy ? `<span>⚡ ${e.energy}/10</span>` : ''}
            ${e.exercise ? `<span>🏃 ${e.exercise}min</span>` : ''}
            ${e.steps ? `<span>${e.steps} steps</span>` : ''}
          </div>
          ${e.notes ? `<div class="log-meta" style="margin-top:4px;font-style:italic;">${escapeHtml(e.notes)}</div>` : ''}
        </div>
        <div class="log-cal" style="font-size:22px;">${e.weight.toFixed(1)}<small style="font-size:10px;color:var(--ink-faint);font-family:var(--font-mono);"> kg</small></div>
        <button class="log-delete" data-date="${e.date}">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.log-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          Storage.deleteWeight(btn.dataset.date);
          render();
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  return { init, render };
})();
