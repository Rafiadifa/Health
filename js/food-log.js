/* ----------------------------------------------------
   food-log.js
   Calendar view + day detail.
   - Calendar on left shows monthly calorie totals.
   - Click a day → detail panel updates.
   - Day detail: net calorie card (in / burned / net),
     burned-cal input, sport selector, food list.
----------------------------------------------------- */

const FoodLog = (() => {
  let selectedDate = formatDate(new Date());
  let viewMonth = new Date();   // year+month being shown in calendar
  let currentPhoto = null;
  let burnedSaveTimer = null;

  const $ = (id) => document.getElementById(id);

  function init() {
    // Calendar month navigation
    $('foodCalPrev').addEventListener('click', () => shiftMonth(-1));
    $('foodCalNext').addEventListener('click', () => shiftMonth(1));

    // Burned cal input — debounced auto-save
    $('burnedInput').addEventListener('input', () => {
      clearTimeout(burnedSaveTimer);
      burnedSaveTimer = setTimeout(() => {
        const v = parseInt($('burnedInput').value);
        Storage.setDailySummary(selectedDate, {
          caloriesBurned: isNaN(v) ? null : v,
        });
        renderNetCard();
        renderCalendar(); // intensity tier might change
      }, 400);
    });

    // Sport selector — auto-save
    $('sportSelect').addEventListener('change', () => {
      Storage.setDailySummary(selectedDate, { sport: $('sportSelect').value });
      renderCalendar(); // dot indicator might change
    });

    // Add Food modal
    $('addFoodBtn').addEventListener('click', openModal);
    ['portion', 'oil', 'sauce', 'sweet'].forEach((id) => {
      $(id).addEventListener('input', () => {
        updateSliderLabels();
        updateEstimate();
      });
    });
    ['foodCategory', 'cookingMethod', 'proteinExtra'].forEach((id) => {
      $(id).addEventListener('change', updateEstimate);
    });
    $('foodPhoto').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        currentPhoto = await compressImage(file, 800, 0.7);
      } catch (err) {
        console.error(err);
        alert('Could not process photo');
        currentPhoto = null;
      }
    });
    $('saveFoodBtn').addEventListener('click', saveFood);

    render();
  }

  function shiftMonth(delta) {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
    renderCalendar();
  }

  function selectDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    renderDayDetail();
  }

  // ============================================================
  // Calendar
  // ============================================================
  function renderCalendar() {
    const grid = $('foodCalGrid');
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = lastDay.getDate();

    $('foodCalMonth').textContent = monthLabel(viewMonth);

    const totals = Storage.getFoodTotalsByDate();
    const today = formatDate(new Date());

    let html = '';

    // Leading days from previous month
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = firstWeekday - 1; i >= 0; i--) {
      html += `<div class="cal-cell off-month">
        <span class="day-num">${prevMonthLast - i}</span>
      </div>`;
    }

    // Days of this month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const ds = formatDate(date);
      const total = totals[ds] || 0;
      const tier = total === 0 ? '' :
        total < 1500 ? 'tier-low' :
        total < 2500 ? 'tier-mid' : 'tier-high';
      const cls = [
        'cal-cell',
        tier,
        ds === today ? 'today' : '',
        ds === selectedDate ? 'selected' : '',
      ].filter(Boolean).join(' ');
      const summary = Storage.getDailySummary(ds);
      const dot = summary.sport && summary.sport !== 'none' ? '<span class="activity-dot"></span>' : '';
      html += `<div class="${cls}" data-date="${ds}">
        ${dot}
        <span class="day-num">${day}</span>
        ${total > 0 ? `<span class="day-val">${total}</span>` : ''}
      </div>`;
    }

    // Trailing days to fill last row
    const cellsSoFar = firstWeekday + daysInMonth;
    const trailing = (7 - (cellsSoFar % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      html += `<div class="cal-cell off-month">
        <span class="day-num">${i}</span>
      </div>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => selectDate(cell.dataset.date));
    });
  }

  // ============================================================
  // Day detail
  // ============================================================
  function renderDayDetail() {
    $('foodDateLabel').textContent = prettyDate(selectedDate);

    // Load burned + sport for this day
    const summary = Storage.getDailySummary(selectedDate);
    $('burnedInput').value = summary.caloriesBurned ?? '';
    $('sportSelect').value = summary.sport || 'none';

    renderNetCard();
    renderList();
  }

  function renderNetCard() {
    const entries = Storage.getFoodLogs(selectedDate);
    const intake = entries.reduce((s, e) => s + (e.calories || 0), 0);
    const summary = Storage.getDailySummary(selectedDate);
    const burned = summary.caloriesBurned;

    $('totalCalories').textContent = intake;

    if (burned == null) {
      $('caloriesBurned').textContent = '—';
      $('caloriesNet').textContent = '—';
      $('caloriesNet').className = 'net-value';
    } else {
      $('caloriesBurned').textContent = burned;
      const net = intake - burned;
      $('caloriesNet').textContent = (net > 0 ? '+' : '') + net;
      $('caloriesNet').className = 'net-value ' +
        (net > 100 ? 'positive' : net < -100 ? 'negative' : '');
    }
  }

  function renderList() {
    const entries = Storage.getFoodLogs(selectedDate).sort((a, b) =>
      (a.time || '').localeCompare(b.time || '')
    );
    const list = $('foodList');

    if (entries.length === 0) {
      list.innerHTML = `<div class="empty-state">Nothing logged for this day yet.</div>`;
      return;
    }

    list.innerHTML = entries.map(e => `
      <div class="log-item">
        ${e.photo ? `<img class="log-photo" src="${e.photo}" alt="" />` : `<div class="log-photo" style="display:flex;align-items:center;justify-content:center;font-size:22px;">🍽️</div>`}
        <div class="log-info">
          <div class="log-name">${escapeHtml(e.name)}</div>
          <div class="log-meta">
            <span>${e.time || ''}</span>
            <span>${Calories.CATEGORY_LABELS[e.category] || e.category}</span>
            <span>${e.portion}× portion</span>
            ${e.oil > 2 ? `<span>oily</span>` : ''}
            ${e.sweet > 1 ? `<span>sweet</span>` : ''}
          </div>
          ${e.notes ? `<div class="log-meta" style="margin-top:4px;font-style:italic;">${escapeHtml(e.notes)}</div>` : ''}
        </div>
        <div class="log-cal">${e.calories}</div>
        <button class="log-delete" data-id="${e.id}" title="Delete">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.log-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          Storage.deleteFoodLog(parseInt(btn.dataset.id));
          render();
        }
      });
    });
  }

  // ============================================================
  // Add Food Modal
  // ============================================================
  function updateSliderLabels() {
    $('portionVal').textContent = parseFloat($('portion').value).toFixed(2) + '×';
    $('oilVal').textContent = $('oil').value;
    $('sauceVal').textContent = $('sauce').value;
    $('sweetVal').textContent = $('sweet').value;
  }

  function updateEstimate() {
    const est = Calories.estimate({
      category: $('foodCategory').value,
      portion: parseFloat($('portion').value),
      oil: parseInt($('oil').value),
      sauce: parseInt($('sauce').value),
      sweet: parseInt($('sweet').value),
      cookingMethod: $('cookingMethod').value,
      proteinExtra: parseInt($('proteinExtra').value),
    });
    $('liveEstimate').textContent = est + ' kcal';
  }

  function openModal() {
    $('foodName').value = '';
    $('foodCategory').value = 'rice';
    $('portion').value = 1;
    $('oil').value = 2;
    $('sauce').value = 1;
    $('sweet').value = 0;
    $('cookingMethod').value = 'normal';
    $('proteinExtra').value = 0;
    $('foodPhoto').value = '';
    $('foodNotes').value = '';
    currentPhoto = null;
    updateSliderLabels();
    updateEstimate();
    $('foodModal').hidden = false;
  }

  function saveFood() {
    const name = $('foodName').value.trim();
    if (!name) {
      alert('Please enter a name');
      return;
    }
    const entry = {
      date: selectedDate,
      time: formatTime(new Date()),
      name,
      category: $('foodCategory').value,
      portion: parseFloat($('portion').value),
      oil: parseInt($('oil').value),
      sauce: parseInt($('sauce').value),
      sweet: parseInt($('sweet').value),
      cookingMethod: $('cookingMethod').value,
      proteinExtra: parseInt($('proteinExtra').value),
      notes: $('foodNotes').value.trim(),
      photo: currentPhoto,
    };
    entry.calories = Calories.estimate(entry);
    Storage.addFoodLog(entry);
    $('foodModal').hidden = true;
    render();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function render() {
    renderCalendar();
    renderDayDetail();
  }

  return { init, render };
})();
