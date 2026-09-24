/* ============================================================
   Basil & Bloom — restaurant settings and menu
   Everything a restaurant owner would change lives in this file:
   name, contact details, opening hours, fees and the menu itself.
   ============================================================ */
(function () {
  "use strict";

  /* Option groups shared by several dishes */
  const SPICE = {
    id: "spice", name: "Spice level", type: "single", required: true,
    choices: [
      { id: "mild", name: "Mild" },
      { id: "medium", name: "Medium", default: true },
      { id: "hot", name: "Hot" },
    ],
  };
  const MILK = {
    id: "milk", name: "Milk", type: "single", required: true,
    choices: [
      { id: "whole", name: "Whole milk", default: true },
      { id: "oat", name: "Oat milk", price: 0.5 },
      { id: "almond", name: "Almond milk", price: 0.5 },
    ],
  };
  const DRINK_SIZE = {
    id: "size", name: "Size", type: "single", required: true,
    choices: [
      { id: "regular", name: "Regular · 12 oz", default: true },
      { id: "large", name: "Large · 16 oz", price: 1 },
    ],
  };

  window.RESTAURANT = {
    name: "Basil & Bloom",
    headline: "Delicious Food",
    tagline: "We make fresh and healthy food",
    about:
      "A neighbourhood kitchen cooking seasonal bowls, charcoal grill plates and all-day breakfast. " +
      "Everything is made to order with produce from farms within 100 miles.",
    address: {
      line1: "48 Orchard Street",
      line2: "Springfield",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=48+Orchard+Street+Springfield",
    },
    phone: "+1 (555) 014-2710",
    email: "hello@basilandbloom.example",

    /* Times are interpreted in the restaurant's own time zone */
    timeZone: "America/New_York",
    locale: "en-US",
    currency: "USD",

    /* 0 = Sunday … 6 = Saturday. Several ranges per day are allowed. */
    hours: {
      0: [["09:00", "21:00"]],
      1: [["08:00", "22:00"]],
      2: [["08:00", "22:00"]],
      3: [["08:00", "22:00"]],
      4: [["08:00", "22:00"]],
      5: [["08:00", "23:00"]],
      6: [["09:00", "23:00"]],
    },

    orderTypes: {
      dineIn: { enabled: true, label: "Dine in", tables: 24 },
      pickup: { enabled: true, label: "Pickup", prepMinutes: 20 },
      delivery: {
        enabled: true, label: "Delivery", prepMinutes: 35,
        fee: 3.5, freeOver: 40, minOrder: 15,
      },
    },
    slotMinutes: 15,
    taxRate: 0.08,
    promoCodes: {
      BLOOM10: { type: "percent", value: 10, label: "10% off your order" },
      FREEDELIVERY: { type: "delivery", label: "Free delivery" },
    },

    /* Demo mode: orders stay on this device and their status advances
       on its own. Turn off once js/store.js talks to a real backend. */
    demo: true,

    featured: "sunrise-egg-bowl",

    tags: {
      v: { label: "Vegetarian", short: "V" },
      vg: { label: "Vegan", short: "VG" },
      gf: { label: "Gluten-free", short: "GF" },
      df: { label: "Dairy-free", short: "DF" },
      spicy: { label: "Spicy", short: "Hot" },
    },

    categories: [
      { id: "all", name: "All", icon: "catAll" },
      { id: "bowls", name: "Bowls", icon: "catBowl" },
      { id: "mains", name: "Mains", icon: "catMains" },
      { id: "burgers", name: "Burgers", icon: "catBurger" },
      { id: "desserts", name: "Desserts", icon: "catDessert" },
      { id: "drinks", name: "Drinks", icon: "catDrink" },
    ],

    dishes: [
      {
        id: "sunrise-egg-bowl", category: "bowls",
        name: "Sunrise Egg Bowl", short: "Eggs, tomato & crispy bacon", price: 15,
        description:
          "Two sunny-side eggs over wilted spinach with crispy bacon, heirloom tomato, cucumber and fresh sage. " +
          "Our chef's special: light, packed with protein and cooked the moment you order.",
        minutes: 25, kcal: 520, tags: ["gf"], allergens: ["Egg"],
        garnish: ["spinach", "basil", "sage"],
        options: [
          {
            id: "eggs", name: "Eggs", type: "single", required: true,
            choices: [
              { id: "sunny", name: "Sunny side up", default: true },
              { id: "scrambled", name: "Scrambled" },
              { id: "poached", name: "Poached" },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "avocado", name: "Avocado", price: 2 },
              { id: "egg", name: "Extra egg", price: 1.5 },
              { id: "toast", name: "Sourdough toast", price: 2.5 },
              { id: "halloumi", name: "Swap bacon for halloumi", price: 1 },
            ],
          },
        ],
      },
      {
        id: "grilled-chicken-salad", category: "bowls",
        name: "Grilled Chicken Salad", short: "Chargrilled chicken & greens", price: 12,
        description:
          "Chargrilled free-range chicken breast on crisp leaves with cherry tomatoes, red onion and our lemon-herb dressing.",
        minutes: 20, kcal: 430, tags: ["gf", "df"], allergens: ["Mustard"],
        garnish: ["basil", "tomato", "spinach"],
        options: [
          {
            id: "dressing", name: "Dressing", type: "single", required: true,
            choices: [
              { id: "lemon", name: "Lemon herb", default: true },
              { id: "honey", name: "Honey mustard" },
              { id: "balsamic", name: "Balsamic" },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "avocado", name: "Avocado", price: 2 },
              { id: "feta", name: "Feta", price: 1.5 },
              { id: "quinoa", name: "Quinoa", price: 2 },
            ],
          },
        ],
      },
      {
        id: "salmon-poke-bowl", category: "bowls",
        name: "Salmon Poke Bowl", short: "Salmon, avocado & mango", price: 16.5,
        description:
          "Sushi-grade salmon over seasoned rice with avocado, mango, edamame, cucumber, seaweed salad and a sesame-soy dressing.",
        minutes: 15, kcal: 610, tags: ["df"], allergens: ["Fish", "Soy", "Sesame"],
        garnish: ["lime", "chili", "basil"],
        options: [
          {
            id: "base", name: "Base", type: "single", required: true,
            choices: [
              { id: "sushi", name: "Sushi rice", default: true },
              { id: "brown", name: "Brown rice" },
              { id: "greens", name: "Mixed greens" },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "salmon", name: "Extra salmon", price: 4 },
              { id: "avocado", name: "Extra avocado", price: 2 },
              { id: "mayo", name: "Spicy mayo", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "garden-buddha-bowl", category: "bowls",
        name: "Garden Buddha Bowl", short: "Quinoa, sweet potato & tahini", price: 13.5,
        description:
          "Roasted sweet potato, crispy chickpeas, kale, red cabbage and avocado over lemony quinoa, finished with tahini.",
        minutes: 15, kcal: 560, tags: ["vg", "gf", "df"], allergens: ["Sesame"],
        garnish: ["spinach", "tomato", "lemon"],
        options: [
          {
            id: "protein", name: "Add protein", type: "single", required: true,
            choices: [
              { id: "none", name: "No thanks", default: true },
              { id: "tofu", name: "Crispy tofu", price: 2.5 },
              { id: "halloumi", name: "Grilled halloumi", price: 3 },
            ],
          },
        ],
      },
      {
        id: "garlic-chicken-skewers", category: "mains",
        name: "Garlic Chicken Skewers", short: "Spicy with garlic", price: 14,
        description:
          "Four skewers of chicken thigh marinated in garlic, chilli and lemon, grilled over charcoal and served with herbs.",
        minutes: 25, kcal: 480, tags: ["gf", "df", "spicy"], allergens: [],
        garnish: ["chili", "lemon", "basil"],
        options: [
          SPICE,
          {
            id: "side", name: "Side", type: "single", required: true,
            choices: [
              { id: "none", name: "No side", default: true },
              { id: "fries", name: "Fries", price: 3 },
              { id: "rice", name: "Jasmine rice", price: 2.5 },
              { id: "salad", name: "Side salad", price: 3 },
            ],
          },
        ],
      },
      {
        id: "spicy-miso-ramen", category: "mains",
        name: "Spicy Miso Ramen", short: "Chashu, soft egg & corn", price: 17,
        description:
          "Wavy noodles in a rich spicy miso broth with braised pork chashu, a marinated soft egg, sweet corn, nori and scallions.",
        minutes: 20, kcal: 720, tags: ["spicy"], allergens: ["Wheat", "Egg", "Soy", "Sesame"],
        garnish: ["chili", "basil", "lime"],
        options: [
          SPICE,
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "egg", name: "Extra soft egg", price: 1.5 },
              { id: "chashu", name: "Extra chashu", price: 3.5 },
              { id: "noodles", name: "Extra noodles", price: 2 },
            ],
          },
        ],
      },
      {
        id: "smash-burger", category: "burgers",
        name: "Double Smash Burger", short: "Two patties, cheddar & fries", price: 13,
        description:
          "Two crisp-edged beef patties, aged cheddar, lettuce, pickles and house sauce in a toasted sesame bun. Served with fries and ketchup.",
        minutes: 15, kcal: 980, tags: [], allergens: ["Wheat", "Milk", "Egg", "Sesame", "Mustard"],
        garnish: ["tomato", "basil", "chili"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "bacon", name: "Smoked bacon", price: 2 },
              { id: "patty", name: "Third patty", price: 3.5 },
              { id: "jalapeno", name: "Jalapeños", price: 0.75 },
            ],
          },
          {
            id: "side", name: "Side", type: "single", required: true,
            choices: [
              { id: "fries", name: "Fries", default: true },
              { id: "salad", name: "Side salad" },
              { id: "sweet", name: "Sweet potato fries", price: 1.5 },
            ],
          },
        ],
      },
      {
        id: "halloumi-burger", category: "burgers",
        name: "Halloumi Burger", short: "Grilled halloumi & side salad", price: 12.5,
        description:
          "Chargrilled halloumi, roasted red pepper, rocket and garlic aioli in a glazed brioche bun, with a crisp side salad.",
        minutes: 15, kcal: 760, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        garnish: ["tomato", "spinach", "basil"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "avocado", name: "Avocado", price: 2 },
              { id: "fries", name: "Add fries", price: 3 },
            ],
          },
        ],
      },
      {
        id: "berry-pancakes", category: "desserts",
        name: "Berry Pancakes", short: "Maple, butter & fresh berries", price: 9.5,
        description:
          "A stack of three fluffy buttermilk pancakes with maple syrup, whipped butter, blueberries and strawberries.",
        minutes: 15, kcal: 640, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        garnish: ["blueberry", "strawberry", "mint"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "cream", name: "Whipped cream", price: 1 },
              { id: "icecream", name: "Scoop of vanilla ice cream", price: 2 },
            ],
          },
        ],
      },
      {
        id: "molten-lava-cake", category: "desserts",
        name: "Molten Lava Cake", short: "Warm chocolate & vanilla", price: 8,
        description:
          "Dark chocolate cake with a molten centre, served warm with vanilla bean ice cream and fresh raspberries.",
        minutes: 12, kcal: 590, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        garnish: ["raspberry", "mint", "raspberry"],
        options: [],
      },
      {
        id: "acai-bowl", category: "desserts",
        name: "Açaí Bowl", short: "Banana, granola & berries", price: 10.5,
        description:
          "Thick açaí and berry blend topped with banana, crunchy granola, strawberries, blueberries, coconut, chia and a drizzle of honey.",
        minutes: 8, kcal: 420, tags: ["v"], allergens: ["Oats"],
        garnish: ["blueberry", "banana", "strawberry"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "pb", name: "Peanut butter", price: 1 },
              { id: "noHoney", name: "Swap honey for agave (vegan)" },
            ],
          },
        ],
      },
      {
        id: "iced-matcha-latte", category: "drinks",
        name: "Iced Matcha Latte", short: "Ceremonial matcha & milk", price: 5.5,
        description:
          "Stone-ground ceremonial matcha whisked to order and poured over ice with your choice of milk.",
        minutes: 5, kcal: 140, tags: ["v", "gf"], allergens: ["Milk"],
        garnish: ["ice", "mint", "lime"],
        options: [DRINK_SIZE, MILK],
      },
      {
        id: "mint-lemonade", category: "drinks",
        name: "Mint Lemonade", short: "Fresh lemon & garden mint", price: 4.5,
        description:
          "Freshly squeezed lemons shaken with garden mint, a touch of cane sugar and sparkling water.",
        minutes: 3, kcal: 110, tags: ["vg", "gf", "df"], allergens: [],
        garnish: ["lemon", "mint", "ice"],
        options: [DRINK_SIZE],
      },
      {
        id: "flat-white", category: "drinks",
        name: "Flat White", short: "Double ristretto & silky milk", price: 4,
        description:
          "A double ristretto with velvety steamed milk, served with one of our almond biscuits.",
        minutes: 4, kcal: 120, tags: ["v", "gf"], allergens: ["Milk", "Almonds"],
        garnish: ["bean", "bean", "bean"],
        options: [
          MILK,
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "shot", name: "Extra shot", price: 0.8 },
              { id: "decaf", name: "Make it decaf" },
            ],
          },
        ],
      },
    ],
  };
})();
