/* =====================================================================
   OLIVE — animated wedding invitation
   ---------------------------------------------------------------------
   This is the ONLY file you need to edit to personalise the invitation.
   Change the text between the quotes, save, refresh the page. Done.

   Tips
   • Line breaks: use \n inside a text, e.g. "Line one\nLine two".
   • Photos: put your images in assets/photos/ and update the paths.
     The hero has two versions: "wide" (computers) and "tall" (phones).
   • Personal links: add ?to=Name to the invitation link and the card
     greets that guest, e.g. https://your-site.com/?to=Anna%20%26%20Luca
   • To hide an optional section, set it to null (e.g. faq: null).
   ===================================================================== */

window.INVITE = {
  lang: "en",
  pageTitle: "Sofia & Matteo — Wedding Invitation",

  /* The couple ---------------------------------------------------------- */
  couple: {
    first: "Sofia",
    second: "Matteo",
    monogram: ["S", "M"],          // letters inside the crest
  },

  /* Wedding date & time -------------------------------------------------
     start/end drive the live countdown and "Add to calendar".
     Write them with the venue's time-zone offset (+02:00 = Italy in summer). */
  event: {
    start: "2027-09-18T15:00:00+02:00",
    end: "2027-09-19T00:30:00+02:00",
    dateText: "Saturday · 18 September 2027",
    place: "Lake Como, Italy",
    calendarTitle: "Sofia & Matteo's wedding",
    calendarDetails: "We can't wait to celebrate with you! Details: ",
  },

  /* Opening card (the gatefold that opens like two doors) --------------- */
  cover: {
    kicker: "Together with their families",
    line: "request the pleasure of your company\nat the celebration of their marriage",
    dear: "Dear",                          // "Dear Anna & Luca,"
    defaultGuest: "friends & family",      // shown when the link has no ?to=
    button: "Open the invitation",
  },

  /* Top navigation -------------------------------------------------------- */
  nav: [
    { label: "Our story", href: "#story" },
    { label: "Details", href: "#details" },
    { label: "RSVP", href: "#rsvp" },
    { label: "FAQ", href: "#faq" },
  ],

  /* Hero ------------------------------------------------------------------ */
  hero: {
    kicker: "The wedding of",
    photoWide: "assets/photos/hero-wide.jpg",
    photoTall: "assets/photos/hero-tall.jpg",
    swans: true,                 // the two animated swans on the lake
    scroll: "Scroll",
  },

  /* Welcome --------------------------------------------------------------- */
  welcome: {
    watermark: "You're Invited",
    title: "Welcome to our wedding invitation",
    text: "As we begin our journey together, we'd love for you to join us in celebrating our big day.\n\nHere you'll find everything you need — our story, the details of the day, travel tips and your RSVP.\n\nYour presence means the world to us, and we can't wait to create unforgettable memories together by the lake.",
    signoff: "With love,",
  },

  /* Our story ------------------------------------------------------------- */
  story: {
    title: "Every love story is beautiful",
    script: "But ours is my favourite",
    text: "Sofia and Matteo met in the most unexpected way — reaching for the very last umbrella in a tiny Florentine bookshop during a summer storm.\n\nWhat started as a polite argument turned into an espresso, then a dinner, then a love story. Over the years they travelled, laughed, built a home and planted a garden full of olive trees.\n\nNow they can't wait to celebrate this beautiful chapter with the people who mean the most to them.",
    photos: ["assets/photos/story-1.jpg", "assets/photos/story-2.jpg"],
    milestones: [
      { year: "2019", title: "The last umbrella", text: "A summer storm in Florence." },
      { year: "2022", title: "Our first olive tree", text: "Planted on a Sunday in April." },
      { year: "2026", title: "Sì!", text: "A proposal at sunset on the lake." },
    ],
  },

  /* Countdown ------------------------------------------------------------- */
  countdown: {
    script: "Countdown to",
    title: "The wedding",
    labels: ["Days", "Hours", "Minutes", "Seconds"],
    after: "We're married! Thank you for celebrating with us.",
    calendarButton: "Add to calendar",
    googleLabel: "Google Calendar",
    appleLabel: "Apple / Outlook (.ics)",
  },

  /* Venue ------------------------------------------------------------------ */
  venue: {
    script: "The Venue",
    name: "Villa Serena",
    address: "Via del Lago 12\n22021 Bellagio (CO)\nLake Como, Italy",
    photo: "assets/photos/venue.jpg",
    mapLabel: "Google Maps",
    map: "https://www.google.com/maps/search/?api=1&query=Bellagio%2C%20Lake%20Como%2C%20Italy",
  },

  /* Details (script heading + text) --------------------------------------- */
  details: [
    {
      title: "The Ceremony",
      text: "Our vows will be exchanged in the lakeside gardens of Villa Serena at three o'clock in the afternoon. Please plan to arrive by 2:30 PM. The ceremony will be followed by an aperitivo, dinner and dancing overlooking the lake.",
    },
    {
      title: "Dress Code",
      text: "Black tie optional. Our palette is inspired by the garden — soft greens, olive, sage and ivory. You're welcome to draw inspiration from these tones.",
      colors: [
        { name: "Olive", hex: "#3d4430" },
        { name: "Sage", hex: "#9aa384" },
        { name: "Moss", hex: "#6b7355" },
        { name: "Sand", hex: "#d8ccb4" },
        { name: "Ivory", hex: "#f5f1e6" },
      ],
    },
    {
      title: "Transportation",
      text: "Complimentary shuttles will depart from Bellagio's ferry pier at 2:00 PM. Return shuttles will run from 11:00 PM until the end of the evening.",
    },
  ],

  /* Order of the day ------------------------------------------------------ */
  schedule: {
    script: "The day",
    title: "Order of events",
    items: [
      { time: "2:30 PM", text: "Welcome drinks in the garden" },
      { time: "3:00 PM", text: "Ceremony by the lake" },
      { time: "4:00 PM", text: "Aperitivo on the terrace" },
      { time: "7:00 PM", text: "Dinner under the olive trees" },
      { time: "9:30 PM", text: "First dance" },
      { time: "12:30 AM", text: "Last shuttle to Bellagio" },
    ],
  },

  /* Gallery ------------------------------------------------------------------ */
  gallery: {
    script: "Moments",
    title: "A few of our favourite things",
    photos: [
      { src: "assets/photos/gallery-1.jpg", caption: "Lemons from the garden" },
      { src: "assets/photos/gallery-2.jpg", caption: "Evening lights" },
      { src: "assets/photos/gallery-3.jpg", caption: "Sunset sail" },
      { src: "assets/photos/gallery-4.jpg", caption: "Villa Serena" },
      { src: "assets/photos/gallery-5.jpg", caption: "Olive branch shadows" },
      { src: "assets/photos/gallery-6.jpg", caption: "Morning espresso" },
    ],
  },

  /* RSVP --------------------------------------------------------------------
     Where do replies go? Fill ONE of these (checked in this order):
       endpoint : a Formspree or Google Sheets (Apps Script) URL
       whatsapp : a phone number with country code, digits only
       email    : an email address (opens the guest's mail app)
     Leave all three empty for demo mode (nothing is sent).            */
  rsvp: {
    endpoint: "",
    whatsapp: "",
    email: "",
    script: "Kindly Reply",
    title: "RSVP",
    deadline: "Please reply by 1 July 2027",
    envelopeHint: "Tap to open",
    maxGuests: 4,
    labels: {
      name: "Full name(s)",
      namePlaceholder: "Anna & Luca Rossi",
      email: "Email (optional)",
      emailPlaceholder: "you@example.com",
      attending: "Will you attend?",
      yes: "Joyfully accept",
      no: "Regretfully decline",
      guests: "Number of guests",
      diet: "Dietary requirements",
      dietPlaceholder: "Vegetarian, allergies…",
      song: "Song request",
      songPlaceholder: "What will get you dancing?",
      message: "Message for the couple",
      messagePlaceholder: "Write us a few words…",
      submit: "Send RSVP",
      sending: "Sending…",
      again: "Send another reply",
      error: "Sorry, that didn't go through. Please try again.",
      required: "Please add your name and let us know if you can attend.",
      whatsappDone: "WhatsApp is open — just press send to deliver your reply.",
      emailDone: "Your email app is open — just press send to deliver your reply.",
      demo: "Demo mode — this reply wasn't sent anywhere.",
    },
    thanksYesTitle: "Grazie, {name}!",
    thanksYes: "We can't wait to celebrate with you by the lake.",
    thanksNoTitle: "Thank you, {name}",
    thanksNo: "You'll be missed — thank you for letting us know.",
  },

  /* FAQ — set to null to hide ---------------------------------------------- */
  faq: {
    script: "Questions",
    title: "Good to know",
    items: [
      { q: "When should I reply by?", a: "Kindly reply by 1 July 2027 so we can plan the perfect evening." },
      { q: "Can I bring a plus-one?", a: "Your invitation includes the guests we've reserved seats for. If you have any questions, just ask us." },
      { q: "Is there parking at the villa?", a: "There is limited parking on site. We recommend the complimentary shuttles from Bellagio's ferry pier." },
      { q: "Do you have a gift registry?", a: "Your presence is the greatest gift. For those who wish, we'll have a honeymoon fund — details on the day." },
      { q: "What will the weather be like?", a: "Mid-September is usually warm (around 24°C) with cooler evenings by the lake. Bring a light layer." },
    ],
  },

  /* Background music — add an mp3 to assets/ and write its path ("" = off) */
  music: { src: "" },

  footer: {
    date: "18 · 09 · 2027",
    hashtag: "#SofiaAndMatteo",
    // Optional credit line, e.g. { text: "Invitation by Studio Name", url: "https://…" }
    credit: { text: "", url: "" },
  },

  rsvpChip: "RSVP",
  menuLabel: "Menu",
  musicLabels: { play: "Play music", pause: "Pause music" },
  lightbox: { close: "Close", prev: "Previous photo", next: "Next photo" },
};
