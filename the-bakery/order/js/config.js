/* ============================================================
   The Bakery — bakery settings and menu
   Everything the bakery would change lives in this file: name,
   contact details, opening hours, fees and the menu itself.
   ============================================================ */
(function () {
  "use strict";

  /* Option groups shared by several items */
  const WARM = {
    id: "warm", name: "Warm it up?", type: "single", required: true,
    choices: [
      { id: "as-is", name: "As it is", default: true },
      { id: "warm", name: "Warmed up" },
    ],
  };
  const MILK = {
    id: "milk", name: "Milk", type: "single", required: true,
    choices: [
      { id: "whole", name: "Whole milk", default: true },
      { id: "oat", name: "Oat milk", price: 0.7 },
      { id: "almond", name: "Almond milk", price: 0.7 },
    ],
  };
  const SIZE = {
    id: "size", name: "Size", type: "single", required: true,
    choices: [
      { id: "regular", name: "Regular · 12 oz", default: true },
      { id: "large", name: "Large · 16 oz", price: 1 },
    ],
  };
  const SLICE = (sliced) => ({
    id: "slice", name: "Slicing", type: "single", required: true,
    choices: [
      { id: "whole", name: "Whole loaf", default: !sliced },
      { id: "sliced", name: "Sliced for you", default: !!sliced },
    ],
  });
  const DOZEN = (extra) => ({
    id: "pack", name: "How many?", type: "single", required: true,
    choices: [
      { id: "one", name: "Just one", default: true },
      { id: "six", name: "Half dozen in the pink bag · save $3", price: extra },
    ],
  });

  window.RESTAURANT = {
    name: "The Bakery",
    headline: "Might be scrumptious!",
    tagline: "Croissants, cookies, pretzels and loaves, baked before sunrise. Order ahead and skip the line.",
    about:
      "A small neighbourhood bakery baking croissants, cookies, pretzels and loaves by hand every morning. " +
      "Everything comes out of the oven from 6 a.m., so when it’s gone, it’s gone.",
    address: {
      line1: "Kensington Market",
      line2: "Toronto, ON",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kensington+Market+Toronto",
    },
    phone: "+1 (416) 555-0147",
    email: "hello@thebakery.example",

    /* The Bakery is a brand concept: say so wherever an order is placed */
    concept: { by: "Kreeative", url: "https://kreeative.xyz" },

    /* Times are interpreted in the bakery's own time zone */
    timeZone: "America/Toronto",
    locale: "en-CA",
    currency: "CAD",

    /* 0 = Sunday … 6 = Saturday. Several ranges per day are allowed. */
    hours: {
      0: [["08:00", "16:00"]],
      1: [["07:00", "18:00"]],
      2: [["07:00", "18:00"]],
      3: [["07:00", "18:00"]],
      4: [["07:00", "18:00"]],
      5: [["07:00", "18:00"]],
      6: [["08:00", "18:00"]],
    },

    orderTypes: {
      dineIn: { enabled: false, label: "Eat in", tables: 0 },
      pickup: { enabled: true, label: "Pickup", prepMinutes: 10 },
      delivery: {
        enabled: true, label: "Delivery", prepMinutes: 30,
        fee: 4.99, freeOver: 35, minOrder: 15,
      },
    },
    slotMinutes: 15,
    /* Prices on the menu already include tax */
    taxRate: 0,
    taxIncluded: true,
    promoCodes: {
      SCRUMPTIOUS: { type: "percent", value: 10, label: "10% off your first bag" },
      FREEDELIVERY: { type: "delivery", label: "Free delivery" },
    },

    /* Demo mode: orders stay on this device and their status advances
       on its own. Turn off once js/store.js talks to a real backend. */
    demo: true,

    featured: "butter-croissant",
    featuredLabel: "Baker’s pick",

    tags: {
      v: { label: "Vegetarian", short: "V" },
      vg: { label: "Vegan", short: "VG" },
      nf: { label: "Nut-free", short: "NF" },
    },
    diets: ["v", "vg", "nf"],

    categories: [
      { id: "all", name: "Everything", icon: "bag" },
      { id: "croissants", name: "Croissants", icon: "catCroissant" },
      { id: "cookies", name: "Cookies", icon: "catCookie" },
      { id: "breads", name: "Breads", icon: "catBread" },
      { id: "pretzels", name: "Pretzels", icon: "catPretzel" },
      { id: "sweets", name: "Sweets", icon: "catCupcake" },
      { id: "drinks", name: "Drinks", icon: "catDrink" },
    ],

    /* Each item's cut-out photo is read from ../assets/menu/<id>-800.webp, with a
       400px copy for the menu grid. Set `image` (and `thumb`) to use other files. */
    dishes: [
      {
        id: "butter-croissant", category: "croissants",
        name: "Butter Croissant", short: "Flaky, golden, all butter", price: 3.95,
        description:
          "Our everyday croissant: French-style butter folded into the dough over three days, " +
          "then baked every morning until it shatters when you bite it. Might be delicious.",
        baked: "Out of the oven at 6 a.m.", kcal: 260, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg"],
        options: [
          WARM,
          {
            id: "extras", name: "On the side", type: "multi", max: 2,
            choices: [
              { id: "jam", name: "Strawberry jam", price: 0.75 },
              { id: "butter", name: "Salted butter", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "pain-au-chocolat", category: "croissants",
        name: "Pain au Chocolat", short: "Two bars of dark chocolate", price: 4.5,
        description:
          "The same croissant dough, rolled around two bars of dark chocolate. Best eaten while the chocolate is still soft.",
        baked: "Out of the oven at 6 a.m.", kcal: 310, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg", "Soy"],
        options: [WARM],
      },
      {
        id: "almond-croissant", category: "croissants",
        name: "Almond Croissant", short: "Twice-baked with almond cream", price: 5.25,
        description:
          "Yesterday’s croissants, filled with almond cream, topped with flaked almonds and baked a second time. Dusted with icing sugar.",
        baked: "Out of the oven at 7 a.m.", kcal: 420, tags: ["v"], allergens: ["Wheat", "Milk", "Egg", "Tree nuts"],
        options: [WARM],
      },
      {
        id: "chunk-cookie", category: "cookies",
        name: "Chocolate Chunk Cookie", short: "Crisp edges, soft middle", price: 3.75,
        description:
          "Brown butter dough, chopped dark and milk chocolate and a pinch of flaky salt. Crisp at the edges, gooey in the middle.",
        baked: "Baked every two hours", kcal: 280, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg", "Soy"],
        options: [DOZEN(15.75)],
      },
      {
        id: "double-cookie", category: "cookies",
        name: "Double Chocolate Cookie", short: "Cocoa dough, dark chocolate chips", price: 3.95,
        description:
          "A dark cocoa dough loaded with chocolate chips, crisp at the edges and chewy in the middle. For when one kind of chocolate isn’t enough.",
        baked: "Baked every two hours", kcal: 300, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg", "Soy"],
        options: [DOZEN(16.75)],
      },
      {
        id: "sourdough", category: "breads",
        name: "Country Sourdough", short: "Slow-fermented for 36 hours", price: 9.5,
        description:
          "Our naturally leavened loaf: wheat with a little rye, fermented for 36 hours and baked dark for a crackling crust.",
        baked: "Out of the oven at 8 a.m.", tags: ["vg", "nf"], allergens: ["Wheat", "Rye"],
        options: [SLICE(false)],
      },
      {
        id: "baguette", category: "breads",
        name: "Classic Baguette", short: "Crackly crust, open crumb", price: 4.25,
        description:
          "Flour, water, salt, yeast and a long night’s rest. Baked three times a day, so there’s always a warm one.",
        baked: "Baked at 7 a.m., 11 a.m. and 3 p.m.", tags: ["vg", "nf"], allergens: ["Wheat"],
      },
      {
        id: "wholemeal-loaf", category: "breads",
        name: "Honey Wholemeal Loaf", short: "Soft crumb, oat bran crust", price: 8,
        description:
          "A soft sandwich loaf of stone-ground wholemeal flour and a spoon of local honey, rolled in oat bran before it bakes. It makes the best toast.",
        baked: "Out of the oven at 8 a.m.", tags: ["v", "nf"], allergens: ["Wheat", "Oats"],
        options: [SLICE(true)],
      },
      {
        id: "butter-pretzel", category: "pretzels",
        name: "Salted Butter Pretzel", short: "Soft, buttery, coarse salt", price: 4.5,
        description:
          "A soft pretzel twisted by hand, brushed with melted butter and scattered with coarse salt. Best warm, with something to dip it in.",
        baked: "Out of the oven at 10 a.m.", kcal: 330, tags: ["v", "nf"], allergens: ["Wheat", "Milk"],
        options: [
          {
            id: "dip", name: "Something to dip in", type: "single", required: true,
            choices: [
              { id: "none", name: "No dip", default: true },
              { id: "mustard", name: "Honey mustard", price: 1 },
              { id: "chocolate", name: "Warm chocolate", price: 1.5 },
            ],
          },
        ],
      },
      {
        id: "pink-cupcake", category: "sweets",
        name: "Pink Vanilla Cupcake", short: "Strawberry buttercream swirl", price: 4.75,
        description:
          "Vanilla bean sponge under a tall swirl of strawberry buttercream. Yes, our mascot is one of these.",
        baked: "Frosted at 9 a.m.", kcal: 380, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg"],
        options: [
          {
            id: "top", name: "On top", type: "multi", max: 1,
            choices: [{ id: "sprinkles", name: "Rainbow sprinkles", price: 0.5 }],
          },
        ],
      },
      {
        id: "macarons", category: "sweets",
        name: "French Macarons", short: "Five flavours, pastel on purpose", price: 2.75,
        description:
          "Almond meringue shells filled with buttercream: raspberry, orange, pistachio, vanilla and strawberry. Crisp, then chewy, then gone.",
        baked: "Filled every morning", kcal: 90, tags: ["v"], allergens: ["Tree nuts", "Egg", "Milk"],
        options: [
          {
            id: "pack", name: "How many?", type: "single", required: true,
            choices: [
              { id: "one", name: "Just one", default: true },
              { id: "six", name: "Box of six · save $2", price: 11.75 },
            ],
          },
          {
            id: "flavour", name: "Flavour", type: "single", required: true,
            choices: [
              { id: "mix", name: "A bit of everything", default: true },
              { id: "raspberry", name: "Raspberry" },
              { id: "pistachio", name: "Pistachio" },
              { id: "vanilla", name: "Vanilla" },
            ],
          },
        ],
      },
      {
        id: "cinnamon-roll", category: "sweets",
        name: "Cinnamon Morning Bun", short: "Croissant dough, cinnamon sugar", price: 5.25,
        description:
          "Our croissant dough rolled up with brown sugar, cinnamon and orange zest, baked in a tin and tossed in cinnamon sugar while it’s still warm.",
        baked: "Out of the oven at 7 a.m.", kcal: 450, tags: ["v", "nf"], allergens: ["Wheat", "Milk", "Egg"],
        options: [
          WARM,
          {
            id: "side", name: "On the side", type: "multi", max: 1,
            choices: [{ id: "dip", name: "Cream cheese dip", price: 0.75 }],
          },
        ],
      },
      {
        id: "iced-latte", category: "drinks",
        name: "Iced Latte", short: "Double shot over ice", price: 5.5,
        description: "Two shots of espresso over ice with cold milk. Made the moment you order.",
        baked: "Made to order", kcal: 130, tags: ["v", "nf"], allergens: ["Milk"],
        options: [MILK, SIZE],
      },
      {
        id: "hot-chocolate", category: "drinks",
        name: "Hot Chocolate", short: "Whipped cream, candy cane", price: 4.75,
        description: "Chopped dark chocolate melted into steamed milk, under a cloud of whipped cream and crushed candy cane. Thick, warm and not too sweet.",
        baked: "Made to order", kcal: 380, tags: ["v", "nf"], allergens: ["Milk", "Soy"],
        options: [
          MILK,
          {
            id: "top", name: "On top", type: "single", required: true,
            choices: [
              { id: "cream-cane", name: "Cream and candy cane", default: true },
              { id: "cream", name: "Just whipped cream" },
              { id: "none", name: "Nothing on top" },
            ],
          },
        ],
      },
      {
        id: "strawberry-milk", category: "drinks",
        name: "Strawberry Shake", short: "Pink, on purpose", price: 5.75,
        description: "Fresh strawberries blended with cold milk and vanilla ice cream, topped with whipped cream and a whole berry. It matches the bag.",
        baked: "Made to order", kcal: 390, tags: ["v", "nf"], allergens: ["Milk"],
        options: [MILK],
      },
    ],
  };
})();
