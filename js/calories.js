/* ----------------------------------------------------
   calories.js
   Pure formula. Tweak the numbers here over time as you
   get a feel for what under/overestimates for you.

   Formula:
     cal = (base × portion + protein_bonus)
           × (1 + 0.08 × oil)
           × (1 + 0.05 × sauce)
           × (1 + 0.10 × sweet)
           × cooking_multiplier
----------------------------------------------------- */

const Calories = (() => {
  // Base kcal per "standard serving" (rough; adjust if your portions differ)
  const BASE = {
    rice: 220,           // 1 bowl 米饭
    noodles: 380,        // 1 bowl 面条
    dumplings: 290,      // ~10 jiaozi or 2 baozi
    meat_dish: 420,      // 肉菜 stir-fry plate
    veggie_dish: 160,    // 素菜 plate
    soup: 110,           // bowl of soup
    salad: 130,          // basic salad
    sandwich: 460,       // sandwich/burger
    pizza: 290,          // 1 slice
    fried_snack: 510,    // serving of fried snack
    fruit: 90,           // 1 fruit
    snack: 280,          // bag of chips / crackers
    dessert: 360,        // cake slice / pastry
    sugary_drink: 160,   // 500ml sugar drink
    unsweet_drink: 5,    // tea/coffee no sugar
    milk_yogurt: 140,    // glass of milk / yogurt cup
    eggs: 80,            // per egg
    cereal: 240,         // breakfast cereal with milk
  };

  const COOKING_MULT = {
    steamed: 0.85,
    normal: 1.00,
    pan_fried: 1.18,
    deep_fried: 1.45,
    grilled: 1.05,
    raw: 1.00,
  };

  function estimate({
    category,
    portion = 1,
    oil = 2,
    sauce = 1,
    sweet = 0,
    cookingMethod = 'normal',
    proteinExtra = 0,
  }) {
    const base = BASE[category] ?? 250;
    const cookMult = COOKING_MULT[cookingMethod] ?? 1.0;

    // unsweetened drinks ignore the modifiers (they're ~0)
    if (category === 'unsweet_drink') return Math.round(base * portion);

    const oilFactor = 1 + 0.08 * oil;
    const sauceFactor = 1 + 0.05 * sauce;
    const sweetFactor = 1 + 0.10 * sweet;

    const cal = (base * portion + Number(proteinExtra))
      * oilFactor
      * sauceFactor
      * sweetFactor
      * cookMult;

    return Math.round(cal);
  }

  // Labels for display
  const CATEGORY_LABELS = {
    rice: 'Rice',
    noodles: 'Noodles',
    dumplings: 'Dumplings',
    meat_dish: 'Meat dish',
    veggie_dish: 'Veggies',
    soup: 'Soup',
    salad: 'Salad',
    sandwich: 'Sandwich',
    pizza: 'Pizza',
    fried_snack: 'Fried',
    fruit: 'Fruit',
    snack: 'Snack',
    dessert: 'Dessert',
    sugary_drink: 'Sweet drink',
    unsweet_drink: 'Tea/Coffee',
    milk_yogurt: 'Dairy',
    eggs: 'Eggs',
    cereal: 'Cereal',
  };

  return { estimate, BASE, COOKING_MULT, CATEGORY_LABELS };
})();
