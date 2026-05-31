/* ----------------------------------------------------
   calories.js
   Calorie engine (per-item) + body-target math.

   An ITEM has a `kind`:
     savory → category, portion, oil, sauce, cooking
     sweet  → category, portion, richness
     drink  → category, portion, sweet
     manual → calories (typed directly)

   A MEAL is just a list of items; its total is the sum.
   Tweak the BASE tables below as you learn your portions.
----------------------------------------------------- */

const Calories = (() => {
  // ---- Base kcal per standard serving ----
  const SAVORY_BASE = {
    rice: 220, noodles: 380, bread: 250, dumplings: 290,
    meat_dish: 400, veggie_dish: 150, seafood: 260, egg: 80,
    tofu: 180, soup: 110, mixed: 320, other_savory: 280,
  };
  const SWEET_BASE = {
    cake: 350, pastry: 320, ice_cream: 250, cookie: 190,
    chocolate: 280, candy: 200, sweet_fruit: 90, yogurt_sweet: 150, other_sweet: 300,
  };
  const DRINK_BASE = {
    water: 0, unsweet: 5, tea_sweet: 120, soda: 140, juice: 110,
    milk: 120, latte: 160, smoothie: 200, alcohol: 160, other_drink: 100,
  };

  // ---- Modifier maps ----
  const COOKING_MULT = { steamed: 0.85, normal: 1.0, pan_fried: 1.18, deep_fried: 1.45, grilled: 1.05 };
  const OIL_MAP   = { none: 0, light: 1, medium: 3, heavy: 5 };
  const SAUCE_MAP = { none: 0, some: 2, lots: 4 };
  const SWEET_MAP = { none: 0, light: 2, sweet: 4, very: 5 };
  const RICHNESS_MULT = { light: 0.8, normal: 1.0, rich: 1.3 };

  function estimateSavory(it) {
    const base = SAVORY_BASE[it.category] ?? 280;
    const oil = OIL_MAP[it.oil] ?? 2;
    const sauce = SAUCE_MAP[it.sauce] ?? 1;
    const cook = COOKING_MULT[it.cooking] ?? 1;
    return Math.round(base * (Number(it.portion) || 1) * (1 + 0.08 * oil) * (1 + 0.05 * sauce) * cook);
  }
  function estimateSweet(it) {
    const base = SWEET_BASE[it.category] ?? 300;
    const rich = RICHNESS_MULT[it.richness] ?? 1;
    return Math.round(base * (Number(it.portion) || 1) * rich);
  }
  function estimateDrink(it) {
    const base = DRINK_BASE[it.category] ?? 100;
    const p = Number(it.portion) || 1;
    if (it.category === 'water' || it.category === 'unsweet') return Math.round(base * p);
    const sweet = SWEET_MAP[it.sweet] ?? 0;
    return Math.round(base * p * (1 + 0.08 * sweet));
  }
  function estimateItem(it) {
    if (!it) return 0;
    if (it.kind === 'manual') return Math.round(Number(it.calories) || 0);
    if (it.kind === 'sweet') return estimateSweet(it);
    if (it.kind === 'drink') return estimateDrink(it);
    return estimateSavory(it);
  }
  function mealTotal(items) {
    return (items || []).reduce((s, it) => s + estimateItem(it), 0);
  }

  // ---- Body targets (Mifflin-St Jeor) ----
  const ACTIVITY_MULT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  function bmr(p) {
    const v = 10 * p.weight + 6.25 * p.height - 5 * p.age;
    return Math.round(p.sex === 'female' ? v - 161 : v + 5);
  }
  function tdee(p) {
    return Math.round(bmr(p) * (ACTIVITY_MULT[p.activity] ?? 1.55));
  }
  function calorieTarget(p) {
    const t = tdee(p);
    if (p.goal === 'lose') return t - 400;
    if (p.goal === 'gain') return t + 300;
    return t;
  }
  function waterTarget(weightKg) {
    return Math.round((35 * weightKg) / 50) * 50; // nearest 50 ml
  }

  // ---- Labels for display ----
  const LABELS = {
    savory: { rice:'Rice', noodles:'Noodles', bread:'Bread/Bun', dumplings:'Dumplings', meat_dish:'Meat', veggie_dish:'Veggies', seafood:'Seafood', egg:'Egg', tofu:'Tofu', soup:'Soup', mixed:'Mixed plate', other_savory:'Other' },
    sweet:  { cake:'Cake', pastry:'Pastry', ice_cream:'Ice cream', cookie:'Cookie', chocolate:'Chocolate', candy:'Candy', sweet_fruit:'Fruit', yogurt_sweet:'Sweet yogurt', other_sweet:'Other' },
    drink:  { water:'Water', unsweet:'Tea/Coffee', tea_sweet:'Sweet tea', soda:'Soda', juice:'Juice', milk:'Milk', latte:'Latte', smoothie:'Smoothie', alcohol:'Alcohol', other_drink:'Drink' },
  };
  function itemLabel(it) {
    if (!it) return '';
    if (it.kind === 'manual') return 'Manual';
    return (LABELS[it.kind] && LABELS[it.kind][it.category]) || it.category || '';
  }

  return {
    estimateItem, estimateSavory, estimateSweet, estimateDrink, mealTotal,
    bmr, tdee, calorieTarget, waterTarget,
    SAVORY_BASE, SWEET_BASE, DRINK_BASE, LABELS, itemLabel,
  };
})();
