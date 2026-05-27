/* ----------------------------------------------------
   food-log.js
   Food tab: list, add modal, live estimate, day nav.
----------------------------------------------------- */

const FoodLog = (() => {
  let currentDate = formatDate(new Date());
  let currentPhoto = null; // base64

  const $ = (id) => document.getElementById(id);

  function init() {
    // Day nav
    $('foodPrevDay').addEventListener('click', () => shiftDay(-1));
    $('foodNextDay').addEventListener('click', () => shiftDay(1));

    // Open modal
    $('addFoodBtn').addEventListener('click', openModal);

    // Sliders → update live values + estimate
    ['portion', 'oil', 'sauce', 'sweet'].forEach((id) => {
      const el = $(id);
      el.addEventListener('input', () => {
        updateSliderLabels();
        updateEstimate();
      });
    });
    ['foodCategory', 'cookingMethod', 'proteinExtra'].forEach((id) => {
      $(id).addEventListener('change', updateEstimate);
    });

    // Photo
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

    // Save
    $('saveFoodBtn').addEventListener('click', saveFood);

    render();
  }

  function shiftDay(delta) {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    currentDate = formatDate(d);
    render();
  }

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
    // reset
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
      date: currentDate,
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

  function render() {
    $('foodDateLabel').textContent = prettyDate(currentDate);
    const entries = Storage.getFoodLogs(currentDate).sort((a, b) =>
      (a.time || '').localeCompare(b.time || '')
    );
    const total = entries.reduce((s, e) => s + (e.calories || 0), 0);
    $('totalCalories').textContent = total;
    $('totalItems').textContent = entries.length;

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

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  return { init, render };
})();
