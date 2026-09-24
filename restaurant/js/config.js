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
      "A neighborhood kitchen cooking all-day brunch, seasonal bowls, ramen and charcoal grill plates. " +
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

    featured: "bacon-egg-skillet",

    tags: {
      v: { label: "Vegetarian", short: "V" },
      vg: { label: "Vegan", short: "VG" },
      gf: { label: "Gluten-free", short: "GF" },
      df: { label: "Dairy-free", short: "DF" },
      spicy: { label: "Spicy", short: "Hot" },
    },

    categories: [
      { id: "all", name: "All", icon: "catAll" },
      { id: "brunch", name: "Brunch", icon: "catBrunch" },
      { id: "bowls", name: "Bowls", icon: "catBowl" },
      { id: "mains", name: "Mains", icon: "catMains" },
      { id: "desserts", name: "Desserts", icon: "catDessert" },
      { id: "drinks", name: "Drinks", icon: "catDrink" },
    ],

    /* Each dish's photo is read from assets/dishes/<id>.webp, with a smaller
       copy in assets/dishes/thumbs/. Set `image` (and `thumb`) to use other files. */
    dishes: [
      {
        id: "bacon-egg-skillet", category: "brunch",
        name: "Bacon & Egg Skillet", short: "Four sunny eggs & crispy bacon", price: 15,
        description:
          "Four free-range eggs fried sunny side up over crispy smoked bacon, finished with cracked black pepper. " +
          "Our chef's pick: cooked in a hot skillet the moment you order.",
        minutes: 20, kcal: 690, tags: ["gf"], allergens: ["Egg"],
        options: [
          {
            id: "eggs", name: "Eggs", type: "single", required: true,
            choices: [
              { id: "sunny", name: "Sunny side up", default: true },
              { id: "over-easy", name: "Over easy" },
              { id: "scrambled", name: "Scrambled" },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "toast", name: "Sourdough toast", price: 2.5 },
              { id: "avocado", name: "Avocado", price: 2 },
              { id: "tomatoes", name: "Grilled tomatoes", price: 1.5 },
              { id: "halloumi", name: "Swap bacon for halloumi", price: 1 },
            ],
          },
        ],
      },
      {
        id: "berry-pancakes", category: "brunch",
        name: "Fig & Berry Pancakes", short: "Figs, berries & maple syrup", price: 11.5,
        description:
          "Fluffy buttermilk pancakes piled with fresh figs, cherries, strawberries and blueberries, with warm maple syrup on the side.",
        minutes: 15, kcal: 620, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "cream", name: "Whipped cream", price: 1 },
              { id: "icecream", name: "Scoop of vanilla ice cream", price: 2 },
              { id: "pancake", name: "Extra pancake", price: 2.5 },
            ],
          },
        ],
      },
      {
        id: "yogurt-granola-bowl", category: "brunch",
        name: "Yogurt & Granola Bowl", short: "Greek yogurt, granola & berries", price: 8.5,
        description:
          "Thick Greek yogurt with our honey-toasted oat granola, raspberries and blackberries.",
        minutes: 5, kcal: 410, tags: ["v"], allergens: ["Milk", "Oats"],
        options: [
          {
            id: "yogurt", name: "Yogurt", type: "single", required: true,
            choices: [
              { id: "greek", name: "Greek yogurt", default: true },
              { id: "coconut", name: "Coconut yogurt", price: 0.5 },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "berries", name: "Extra berries", price: 1.5 },
              { id: "honey", name: "Drizzle of honey", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "garden-buddha-bowl", category: "bowls",
        name: "Garden Buddha Bowl", short: "Roasted veg, quinoa & herbs", price: 13.5,
        description:
          "Roasted broccoli, carrots, Brussels sprouts, peppers and zucchini over lemony quinoa, finished with fresh parsley and tahini.",
        minutes: 15, kcal: 540, tags: ["vg", "gf", "df"], allergens: ["Sesame"],
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
        id: "prawn-poke-bowl", category: "bowls",
        name: "Prawn Poke Bowl", short: "King prawns, avocado & chili", price: 16.5,
        description:
          "Sesame king prawns over sushi rice with avocado, seaweed salad, carrot, fresh chili and crushed peanuts, dressed with soy and sesame.",
        minutes: 15, kcal: 580, tags: ["df"], allergens: ["Crustaceans", "Soy", "Sesame", "Peanuts"],
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
              { id: "prawns", name: "Extra prawns", price: 4 },
              { id: "avocado", name: "Extra avocado", price: 2 },
              { id: "mayo", name: "Spicy mayo", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "acai-bowl", category: "bowls",
        name: "Açaí Bowl", short: "Berries, granola & mint", price: 10.5,
        description:
          "Thick açaí and berry blend topped with crunchy granola, blueberries, raspberries, blackberries, coconut flakes and fresh mint.",
        minutes: 8, kcal: 430, tags: ["v"], allergens: ["Oats"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "pb", name: "Peanut butter drizzle", price: 1 },
              { id: "banana", name: "Sliced banana", price: 0.75 },
              { id: "chia", name: "Chia seeds", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "tonkotsu-ramen", category: "mains",
        name: "Tonkotsu Ramen", short: "Chashu, soft egg & bamboo", price: 17,
        description:
          "Springy noodles in a creamy pork-bone broth simmered for 12 hours, with rolled chashu pork, a marinated soft egg, " +
          "bamboo shoots, spinach, wood-ear mushrooms, fish cake and scallions.",
        minutes: 20, kcal: 760, tags: [], allergens: ["Wheat", "Egg", "Soy", "Fish", "Sesame"],
        options: [
          {
            id: "broth", name: "Broth", type: "single", required: true,
            choices: [
              { id: "classic", name: "Classic", default: true },
              { id: "spicy", name: "Spicy, with chili oil" },
            ],
          },
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "egg", name: "Extra soft egg", price: 1.5 },
              { id: "chashu", name: "Extra chashu", price: 3.5 },
              { id: "noodles", name: "Extra noodles", price: 2 },
              { id: "corn", name: "Buttered corn", price: 1 },
            ],
          },
        ],
      },
      {
        id: "lamb-kofta-skewers", category: "mains",
        name: "Lamb Kofta Skewers", short: "Spiced lamb, tomatoes & arugula", price: 16,
        description:
          "Two chargrilled skewers of hand-minced lamb with parsley, cumin and sumac, served on arugula with heirloom cherry tomatoes, fresh chili and cilantro.",
        minutes: 25, kcal: 640, tags: ["gf", "df", "spicy"], allergens: [],
        options: [
          SPICE,
          {
            id: "side", name: "Side", type: "single", required: true,
            choices: [
              { id: "none", name: "No side", default: true },
              { id: "flatbread", name: "Warm flatbread", price: 2.5 },
              { id: "fries", name: "Fries", price: 3 },
              { id: "rice", name: "Saffron rice", price: 2.5 },
            ],
          },
        ],
      },
      {
        id: "cheeseburger-duo", category: "mains",
        name: "Cheeseburger Duo", short: "Two cheeseburgers & house sauce", price: 14,
        description:
          "Two griddled beef cheeseburgers with melted cheddar, pickles and our house sauce, one in a sesame bun and one in soft brioche.",
        minutes: 15, kcal: 980, tags: [], allergens: ["Wheat", "Milk", "Egg", "Sesame", "Mustard"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 3,
            choices: [
              { id: "bacon", name: "Smoked bacon", price: 2 },
              { id: "fries", name: "Add fries", price: 3 },
              { id: "jalapeno", name: "Jalapeños", price: 0.75 },
            ],
          },
        ],
      },
      {
        id: "chocolate-truffle-cake", category: "desserts",
        name: "Chocolate Truffle Cake", short: "Dark chocolate & salted caramel", price: 8.5,
        description:
          "A tall slice of dark chocolate truffle cake with piped ganache, finished with chocolate sauce and dots of salted caramel.",
        minutes: 5, kcal: 560, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        options: [
          {
            id: "extras", name: "Extras", type: "multi", max: 2,
            choices: [
              { id: "icecream", name: "Scoop of vanilla ice cream", price: 2 },
              { id: "cream", name: "Whipped cream", price: 1 },
            ],
          },
        ],
      },
      {
        id: "chocolate-sphere", category: "desserts",
        name: "Chocolate Sphere", short: "Chocolate dome, cocoa soil & cream", price: 11,
        description:
          "A glossy dark chocolate dome over chocolate mousse, on a trail of cocoa soil with vanilla cream, orange gel, blueberries and edible flowers.",
        minutes: 10, kcal: 480, tags: ["v"], allergens: ["Wheat", "Milk", "Egg"],
        options: [],
      },
      {
        id: "matcha-latte", category: "drinks",
        name: "Matcha Latte", short: "Ceremonial matcha & steamed milk", price: 5.5,
        description:
          "Stone-ground ceremonial matcha whisked to order and topped with silky steamed milk. Also good iced.",
        minutes: 5, kcal: 140, tags: ["v", "gf"], allergens: ["Milk"],
        options: [
          DRINK_SIZE,
          MILK,
          {
            id: "serve", name: "Serve", type: "single", required: true,
            choices: [
              { id: "hot", name: "Hot", default: true },
              { id: "iced", name: "Iced" },
            ],
          },
        ],
      },
      {
        id: "mint-lemonade", category: "drinks",
        name: "Mint Lemonade", short: "Fresh lemon & garden mint", price: 4.5,
        description:
          "Freshly squeezed lemons muddled with garden mint and a touch of cane sugar, served over ice.",
        minutes: 3, kcal: 110, tags: ["vg", "gf", "df"], allergens: [],
        options: [
          DRINK_SIZE,
          {
            id: "style", name: "Style", type: "single", required: true,
            choices: [
              { id: "still", name: "Still", default: true },
              { id: "sparkling", name: "Sparkling" },
            ],
          },
        ],
      },
      {
        id: "flat-white", category: "drinks",
        name: "Flat White", short: "Double ristretto & velvet milk", price: 4,
        description:
          "A double ristretto with velvety steamed milk, poured with latte art.",
        minutes: 4, kcal: 120, tags: ["v", "gf"], allergens: ["Milk"],
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
