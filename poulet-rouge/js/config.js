/* ============================================================
   Poulet Rouge (concept) — restaurant settings and menu
   An unofficial ordering concept by Kreeative. Names, prices and
   calorie ranges follow Poulet Rouge's public Montréal menu (2026);
   everything else here is part of the concept.
   Text that guests read comes in French and English: { fr, en }.
   ============================================================ */
(function () {
  "use strict";

  const L = (fr, en) => ({ fr, en: en == null ? fr : en });

  /* ---------- Bowl ingredients ----------
     Each one is drawn in the live bowl from its photo in assets/textures/.
     `tint` colours the grilled chicken for that flavour. */
  const FLAVOURS = [
    { id: "bbq", name: L("BBQ"), tint: "#7a2c12", tintAlpha: 0.34 },
    { id: "sucre", name: L("Sucré", "Sweet"), tint: "#c07a22", tintAlpha: 0.3 },
    { id: "hercules", name: L("Hercules"), tint: "#5c6b2e", tintAlpha: 0.22 },
    { id: "citron", name: L("Citron", "Lemon"), tint: "#e9c94a", tintAlpha: 0.3 },
    { id: "shisha", name: L("Shisha"), tint: "#a8641c", tintAlpha: 0.3 },
    { id: "ail", name: L("À l’ail", "Garlic"), tint: "#f1e3c4", tintAlpha: 0.26 },
    { id: "volcano", name: L("Volcano"), tint: "#c3331a", tintAlpha: 0.42, spicy: true },
    { id: "epice", name: L("Épicé", "Spicy"), tint: "#d4561f", tintAlpha: 0.34, spicy: true },
    { id: "vege", name: L("Filet végétal", "Plant-based filet"), tint: "#c9a26b", tintAlpha: 0.25, plant: true },
  ];

  const BASES = [
    { id: "rice", name: L("Riz brun", "Brown rice") },
    { id: "bulgur", name: L("Boulgour", "Bulgur wheat") },
    { id: "quinoa", name: L("Quinoa") },
    { id: "romaine", name: L("Laitue romaine", "Romaine lettuce") },
  ];

  const TOPPINGS = [
    { id: "tomato", name: L("Tomates", "Tomatoes") },
    { id: "cucumber", name: L("Concombres", "Cucumbers") },
    { id: "red-onion", name: L("Oignons rouges", "Red onions") },
    { id: "pepper", name: L("Poivrons", "Bell peppers") },
    { id: "corn", name: L("Maïs", "Corn") },
    { id: "jack", name: L("Monterey Jack") },
    { id: "feta", name: L("Feta") },
    { id: "jalapeno", name: L("Jalapeños"), spicy: true },
    { id: "black-beans", name: L("Haricots noirs", "Black beans") },
    { id: "olives", name: L("Olives") },
    { id: "cranberries", name: L("Canneberges séchées", "Dried cranberries") },
    { id: "avocado", name: L("Avocat", "Avocado") },
    { id: "spinach", name: L("Épinards", "Spinach") },
    { id: "beets", name: L("Betteraves", "Beets") },
    { id: "guacamole", name: L("Guacamole") },
  ];

  /* Sauces are drawn as a drizzle in their own colour */
  const SAUCES = [
    { id: "mayo-epicee", name: L("Mayo épicée", "Spicy mayo"), color: "#ef8a4c", spicy: true },
    { id: "tzatziki", name: L("Tzatziki"), color: "#f4f1e4", fleck: "#6f8f4e" },
    { id: "cesar-ranch", name: L("César ranch", "Caesar ranch"), color: "#efe4c7" },
    { id: "chipotle", name: L("Chipotle fumé", "Smoky chipotle"), color: "#a8452a" },
    { id: "miel-dijon", name: L("Miel Dijon", "Honey Dijon"), color: "#e1ad38" },
    { id: "lime-coriandre", name: L("Lime coriandre", "Lime cilantro"), color: "#c6d985" },
    { id: "zaatar", name: L("Zaatar doux", "Sweet zaatar"), color: "#b29c55" },
  ];

  /* Option groups used by the bowls */
  const flavourGroup = (max) => ({
    id: "flavours", from: "flavours", title: L("Saveur", "Flavour"),
    min: 1, max, included: 1, extra: 2.2,
    hint: max > 1 ? L("1 incluse, 2e saveur +2,20 $", "1 included, 2nd flavour +$2.20") : L("Choisissez 1", "Choose 1"),
  });
  const baseGroup = (max) => ({ id: "bases", from: "bases", title: L("Base", "Base"), min: 1, max });
  const toppingGroup = (max) => ({ id: "toppings", from: "toppings", title: L("Garnitures", "Toppings"), min: 0, max });
  const sauceGroup = (max) => ({ id: "sauces", from: "sauces", title: L("Sauce", "Sauce"), min: 0, max });

  window.RESTAURANT = {
    name: "Poulet Rouge",
    headline: L("Votre bol, à votre façon.", "Your bowl, your way."),
    tagline: L("Poulet grillé, huit saveurs signature. Frais, savoureux et 100 % personnalisable.",
      "Grilled chicken in eight signature flavours. Fresh, tasty and 100% customizable."),
    about: L(
      "Poulet Rouge est né en 2012 aux Galeries Joliette : deux amis, un comptoir et une idée de bols au poulet grillé à composer soi-même, inspirés de la Méditerranée et de l’Amérique du Nord. Le rouge, pour l’énergie, l’amour et la passion.",
      "Poulet Rouge started in 2012 at Galeries Joliette: two friends, one counter and the idea of grilled chicken bowls you build yourself, inspired by the Mediterranean and North America. Red, for energy, love and passion."
    ),

    /* The concept: who made it, and what it does not do */
    concept: {
      by: "Kreeative",
      url: "https://kreeative.xyz",
    },

    store: { name: "Plateau-Mont-Royal", city: "Montréal, QC" },

    /* Times are interpreted in the restaurant's own time zone */
    timeZone: "America/Toronto",
    locales: { fr: "fr-CA", en: "en-CA" },
    currency: "CAD",

    /* 0 = Sunday … 6 = Saturday */
    hours: {
      0: [["11:00", "21:00"]],
      1: [["11:00", "21:00"]],
      2: [["11:00", "21:00"]],
      3: [["11:00", "21:00"]],
      4: [["11:00", "22:00"]],
      5: [["11:00", "22:00"]],
      6: [["11:00", "22:00"]],
    },

    orderTypes: {
      pickup: { enabled: true, label: L("Pour emporter", "Pickup"), prepMinutes: 15 },
      delivery: {
        enabled: true, label: L("Livraison", "Delivery"), prepMinutes: 35,
        fee: 3.99, freeOver: 35, minOrder: 15,
      },
    },
    slotMinutes: 15,

    /* Québec: GST and QST, each on the subtotal */
    taxes: [
      { id: "gst", label: L("TPS", "GST"), rate: 0.05 },
      { id: "qst", label: L("TVQ", "QST"), rate: 0.09975 },
    ],

    /* Rouge Club, the loyalty program: 10 points per dollar, 100 to start */
    club: { name: "Rouge Club", perDollar: 10, welcome: 100 },

    /* Demo mode: orders stay on this device and their status advances
       on its own. Nothing is sent to a restaurant. */
    demo: true,

    featured: "rouge-bol",

    ingredients: { flavours: FLAVOURS, bases: BASES, toppings: TOPPINGS, sauces: SAUCES },

    tags: {
      spicy: { label: L("Piquant", "Spicy") },
      plant: { label: L("Option végétale", "Plant-based option") },
    },

    categories: [
      { id: "all", name: L("Tout", "All"), icon: "catAll" },
      { id: "bols", name: L("Bols", "Bowls"), icon: "catBowl" },
      { id: "cote", name: L("À côté", "Sides"), icon: "catFries" },
      { id: "desserts", name: L("Desserts"), icon: "catDessert" },
      { id: "boissons", name: L("Boissons", "Drinks"), icon: "catDrink" },
    ],

    dishes: [
      {
        id: "rouge-bol", category: "bols", kind: "bowl",
        name: L("Rouge Bol", "Rouge Bowl"),
        short: L("2 bases, 7 garnitures, 2 sauces", "2 bases, 7 toppings, 2 sauces"),
        description: L(
          "Le bol signature. Du poulet grillé dans la saveur de votre choix, jusqu’à deux bases, sept garnitures et deux sauces. Une deuxième saveur ? 2,20 $ de plus.",
          "The signature bowl. Grilled chicken in the flavour of your choice, up to two bases, seven toppings and two sauces. A second flavour is $2.20 more."
        ),
        price: 17.49, kcal: "310–1 250", minutes: 10, tags: ["plant"],
        groups: [flavourGroup(2), baseGroup(2), toppingGroup(7), sauceGroup(2)],
        defaults: { flavours: ["bbq"], bases: ["rice"], toppings: [], sauces: [] },
        look: { flavours: ["shisha"], bases: ["quinoa", "rice"], toppings: ["avocado", "corn", "black-beans", "tomato", "feta", "red-onion", "cucumber"], sauces: ["lime-coriandre"] },
      },
      {
        id: "tout-garni", category: "bols", kind: "bowl",
        name: L("Rouge Bol tout garni", "All-dressed Rouge Bowl"),
        short: L("Le classique, déjà composé", "The classic, ready to go"),
        description: L(
          "Poulet grillé dans la saveur de votre choix sur riz brun et boulgour, mayo épicée et tzatziki, tomates, concombres, oignons rouges, poivrons, maïs et Monterey Jack. Tout reste modifiable.",
          "Grilled chicken in the flavour of your choice on brown rice and bulgur wheat, with spicy mayo and tzatziki, tomatoes, cucumbers, red onions, bell peppers, corn and Monterey Jack. You can still change anything."
        ),
        price: 17.49, kcal: "310–1 250", minutes: 10, tags: ["plant"],
        groups: [flavourGroup(2), baseGroup(2), toppingGroup(7), sauceGroup(2)],
        defaults: { flavours: ["bbq"], bases: ["rice", "bulgur"], toppings: ["tomato", "cucumber", "red-onion", "pepper", "corn", "jack"], sauces: ["mayo-epicee", "tzatziki"] },
      },
      {
        id: "rouge-mini", category: "bols", kind: "bowl",
        name: L("Rouge Mini"),
        short: L("1 base, 3 garnitures, 1 sauce", "1 base, 3 toppings, 1 sauce"),
        description: L(
          "Le petit format pour les petites faims : poulet grillé dans une saveur, une base, trois garnitures et une sauce.",
          "The small one for smaller appetites: grilled chicken in one flavour, one base, three toppings and one sauce."
        ),
        price: 13.99, kcal: "160–670", minutes: 8, tags: ["plant"],
        groups: [flavourGroup(1), baseGroup(1), toppingGroup(3), sauceGroup(1)],
        defaults: { flavours: ["citron"], bases: ["rice"], toppings: [], sauces: [] },
        look: { flavours: ["citron"], bases: ["romaine"], toppings: ["cucumber", "tomato", "feta"], sauces: ["tzatziki"] },
      },
      {
        id: "rouge-poutine", category: "bols", kind: "bowl", base: "poutine",
        name: L("Rouge Poutine"),
        short: L("Poutine, 3 garnitures, 1 sauce", "Poutine, 3 toppings, 1 sauce"),
        description: L(
          "Une vraie poutine, frites, fromage en grains et sauce brune, couronnée de poulet grillé, de trois garnitures et d’une sauce. Une deuxième saveur ? 2,20 $ de plus.",
          "A real poutine, fries, cheese curds and gravy, topped with grilled chicken, three toppings and a sauce. A second flavour is $2.20 more."
        ),
        price: 18.99, kcal: "1 130–1 550", minutes: 12, tags: ["plant"],
        groups: [flavourGroup(2), toppingGroup(3), sauceGroup(1)],
        defaults: { flavours: ["volcano"], toppings: [], sauces: [] },
        look: { flavours: ["volcano"], toppings: ["jalapeno", "red-onion", "corn"], sauces: ["chipotle"] },
      },
      {
        id: "frites", category: "cote",
        name: L("Frites", "Fries"),
        short: L("Dorées et croustillantes", "Golden and crispy"),
        description: L("Des frites dorées et croustillantes.", "Golden, crispy fries."),
        price: 4.99, minutes: 6, tags: [],
        groups: [],
      },
      {
        id: "poutine", category: "cote",
        name: L("Poutine"),
        short: L("Frites, fromage en grains, sauce brune", "Fries, cheese curds, gravy"),
        description: L("La poutine du Québec : frites, fromage en grains et sauce brune.",
          "Québec’s poutine: fries, cheese curds and gravy."),
        price: 8.99, minutes: 7, tags: [],
        groups: [],
      },
      {
        id: "choco-mousse", category: "desserts",
        name: L("Choco mousse", "Chocolate mousse"),
        short: L("Mousse au chocolat", "Chocolate mousse"),
        description: L("Une mousse au chocolat, à la cuillère.", "A chocolate mousse, eaten with a spoon."),
        price: 3.99, minutes: 1, tags: [],
        groups: [],
      },
      {
        id: "delice-framboise", category: "desserts",
        name: L("Délice framboise", "Raspberry delight"),
        short: L("Crème et framboises", "Cream and raspberries"),
        description: L("Un dessert crémeux aux framboises.", "A creamy raspberry dessert."),
        price: 3.99, minutes: 1, tags: [],
        groups: [],
      },
      {
        id: "tiramisu", category: "desserts",
        name: L("Tiramisu"),
        short: L("Café, mascarpone, cacao", "Coffee, mascarpone, cocoa"),
        description: L("Le classique italien : biscuits imbibés de café, crème au mascarpone et cacao.",
          "The Italian classic: coffee-soaked biscuits, mascarpone cream and cocoa."),
        price: 3.99, minutes: 1, tags: [],
        groups: [],
      },
      {
        id: "boisson-gazeuse", category: "boissons",
        name: L("Boisson gazeuse", "Soft drink"),
        short: L("Cola, zéro, gingembre ou citron-lime", "Cola, zero, ginger ale or lemon-lime"),
        description: L("Bien froide.", "Served cold."),
        price: 2.99, minutes: 1, tags: [],
        groups: [{
          id: "flavor", type: "single", title: L("Choix", "Choice"), min: 1, max: 1,
          choices: [
            { id: "cola", name: L("Cola"), default: true },
            { id: "zero", name: L("Cola zéro", "Cola zero") },
            { id: "ginger", name: L("Soda au gingembre", "Ginger ale") },
            { id: "lemon-lime", name: L("Citron-lime", "Lemon-lime") },
          ],
        }],
      },
      {
        id: "the-glace", category: "boissons",
        name: L("Thé glacé", "Iced tea"),
        short: L("Citron, servi froid", "Lemon, served cold"),
        description: L("Thé glacé au citron.", "Lemon iced tea."),
        price: 2.99, minutes: 1, tags: [],
        groups: [],
      },
      {
        id: "eau-petillante", category: "boissons",
        name: L("Eau pétillante", "Sparkling water"),
        short: L("Fines bulles", "Fine bubbles"),
        description: L("Une eau pétillante, servie froide.", "Sparkling water, served cold."),
        price: 2.99, minutes: 1, tags: [],
        groups: [],
      },
    ],
  };
})();
