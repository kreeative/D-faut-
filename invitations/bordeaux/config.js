/* =====================================================================
   BORDEAUX — animated wedding invitation
   ---------------------------------------------------------------------
   This is the ONLY file you need to edit to personalise the invitation.
   Change the text between the quotes, save, refresh the page. Done.

   Tips
   • Line breaks: use \n inside a text, e.g. "Line one\nLine two".
   • Photos: put your images in assets/photos/ and update the paths.
     Portrait photos work best for the story and gallery.
   • Personal links: add ?to=Name to the invitation link and the
     envelope is addressed to that guest, e.g.
       https://your-site.com/?to=Sophie%20%26%20Tom
   • To hide an optional section, set it to null (e.g. notes: null).
   ===================================================================== */

window.INVITE = {
  lang: "en",

  /* The couple ---------------------------------------------------------- */
  couple: {
    names: "Amélie & Julien",     // used in the envelope, footer, calendar
    monogram: "A&J",              // pressed into the wax seal (3-4 characters)
  },

  /* Wedding date & time -------------------------------------------------
     start/end drive the live countdown and "Add to calendar".
     Write them with the venue's time-zone offset (+02:00 = Paris summer). */
  event: {
    start: "2027-06-19T16:00:00+02:00",
    end: "2027-06-20T01:00:00+02:00",
    dateText: "Saturday, June 19, 2027",
    city: "Bordeaux, France",
    calendarTitle: "Amélie & Julien's wedding",
    calendarDetails: "We can't wait to celebrate with you! Details: ",
  },

  /* Envelope that opens the invitation ----------------------------------- */
  envelope: {
    kicker: "You're invited",
    toLabel: "To",
    defaultGuest: "our dearest friends", // shown when the link has no ?to=
    hint: "Tap the seal to open",
    letterTitle: "Together with our families",
    letterText: "we invite you to celebrate\nour wedding",
    stampText: "Love\nletter",
  },

  /* Main card (top of the page) ------------------------------------------ */
  hero: {
    nav: ["Story", "Details", "RSVP"],
    kicker: "Wedding",
    script: "Moreau",               // the big calligraphy word
    overlay: "Mr. & Mrs.",          // printed across the calligraphy ("" to hide)
    subline: "Amélie & Julien",
    datePill: ["06", "19"],         // the two numbers in the pill (month • day)
    note: "Two hearts, one journey.\nCome celebrate our beautiful union.",
    nameTag: "Amélie & Julien!",
    location: "Château Lumière, Bordeaux",
    locationLabel: "Location:",
    // The faded handwriting behind the note (a poem, your vows, a lyric you wrote…)
    lyrics: "Every day with you\nfeels like a love letter\nwritten in candlelight\nsealed with a kiss\nand sent to forever\nall my love, always",
    photos: {
      stripTop: "assets/photos/strip-1.jpg",
      stripBottom: "assets/photos/strip-2.jpg",
      left: "assets/photos/moment-1.jpg",
      right: "assets/photos/moment-2.jpg",
    },
    cameraHint: "tap me",
    blackAndWhite: true,            // photo-booth strip + left photo in black & white
  },

  /* Blurred photo behind everything */
  backdrop: "assets/photos/backdrop.jpg",

  /* Countdown ------------------------------------------------------------ */
  countdown: {
    title: "Counting down",
    subtitle: "to the best day of our lives",
    labels: ["Days", "Hours", "Minutes", "Seconds"],
    after: "Just married! Thank you for celebrating with us.",
    admit: "Admit two",
    calendarButton: "Add to calendar",
    googleLabel: "Google",
    appleLabel: "Apple / Outlook",
  },

  /* Our story -------------------------------------------------------------- */
  story: {
    title: "Our story",
    intro: "Three little moments that led to one big day.",
    chapters: [
      {
        photo: "assets/photos/story-1.jpg",
        caption: "the first coffee",
        date: "Spring 2019",
        title: "One table left",
        text: "A rainy Tuesday and a café with a single free table. Julien asked if the seat was taken. Five hours and three cappuccinos later, neither of us wanted to leave.",
      },
      {
        photo: "assets/photos/story-2.jpg",
        caption: "our first sunset",
        date: "Summer 2021",
        title: "Golden hour",
        text: "A tiny sailboat, a borrowed bottle of Bordeaux and the whole Atlantic turning gold. Somewhere between the waves we both knew.",
      },
      {
        photo: "assets/photos/story-3.jpg",
        caption: "oui, oui, oui!",
        date: "December 2025",
        title: "The question",
        text: "Candlelight, snow on the windows and one very nervous question. The answer took less than a second.",
      },
    ],
  },

  /* Ceremony & reception (shown as hanging tags) ------------------------ */
  details: {
    title: "The details",
    events: [
      {
        label: "The Ceremony",
        time: "4:00 PM",
        place: "Chapelle des Vignes",
        address: "12 Route des Vignes, 33000 Bordeaux",
        map: "https://www.google.com/maps/search/?api=1&query=Bordeaux%2C%20France",
      },
      {
        label: "The Reception",
        time: "6:30 PM",
        place: "Château Lumière",
        address: "1 Allée des Tilleuls, 33250 Pauillac",
        map: "https://www.google.com/maps/search/?api=1&query=Pauillac%2C%20France",
      },
    ],
    mapLabel: "Open map",
  },

  dressCode: {
    title: "Dress code",
    text: "Black tie optional — think deep wine, champagne and midnight tones.",
    colors: [
      { name: "Bordeaux", hex: "#4b0a0f" },
      { name: "Claret", hex: "#8c1c24" },
      { name: "Champagne", hex: "#e6d3ae" },
      { name: "Midnight", hex: "#1d1a24" },
      { name: "Ivory", hex: "#f5efe4" },
    ],
  },

  /* Order of the day ------------------------------------------------------ */
  schedule: {
    title: "The day",
    items: [
      { time: "3:30 PM", text: "Guests arrive" },
      { time: "4:00 PM", text: "Ceremony" },
      { time: "5:00 PM", text: "Champagne & photos" },
      { time: "7:00 PM", text: "Dinner under the stars" },
      { time: "9:30 PM", text: "First dance" },
      { time: "11:00 PM", text: "Dancing until late" },
    ],
  },

  /* Sticky notes ("good to know") — set to null to hide ------------------ */
  notes: {
    title: "Good to know",
    items: [
      { title: "Gifts", text: "Your presence is our present. If you'd like to spoil us, a little something towards our honeymoon would mean the world." },
      { title: "Stay", text: "We've reserved rooms at Hôtel des Quais — mention our names for the wedding rate." },
      { title: "Little ones", text: "We love your children, but this celebration is adults only. Enjoy the night off!" },
    ],
  },

  /* Gallery (scrolling film strip) -------------------------------------- */
  gallery: {
    title: "Moments",
    photos: [
      { src: "assets/photos/strip-1.jpg", caption: "Cheers to us" },
      { src: "assets/photos/story-1.jpg", caption: "Where it all began" },
      { src: "assets/photos/moment-2.jpg", caption: "Candlelight evenings" },
      { src: "assets/photos/strip-2.jpg", caption: "Sparks, always" },
      { src: "assets/photos/story-2.jpg", caption: "Golden hour" },
      { src: "assets/photos/moment-1.jpg", caption: "Champagne tower" },
      { src: "assets/photos/story-3.jpg", caption: "Forever starts now" },
      { src: "assets/photos/backdrop.jpg", caption: "See you on the dance floor" },
    ],
  },

  /* RSVP ------------------------------------------------------------------
     Where do replies go? Fill ONE of these (checked in this order):
       endpoint : a Formspree or Google Sheets (Apps Script) URL
       whatsapp : a phone number with country code, digits only
       email    : an email address (opens the guest's mail app)
     Leave all three empty for demo mode (nothing is sent).            */
  rsvp: {
    endpoint: "",
    whatsapp: "",
    email: "",
    title: "Kindly reply",
    deadline: "Please reply by May 1, 2027",
    maxGuests: 4,
    labels: {
      name: "Your name(s)",
      namePlaceholder: "Sophie & Tom",
      attending: "Will you join us?",
      yes: "Joyfully accepts",
      no: "Regretfully declines",
      guests: "Number of guests",
      diet: "Dietary requirements",
      dietPlaceholder: "Vegetarian, allergies…",
      song: "A song that gets you dancing",
      songPlaceholder: "Artist – song",
      message: "A note for the couple",
      messagePlaceholder: "Write us something sweet…",
      submit: "Send with love",
      sending: "Sending…",
      again: "Send another reply",
      error: "Oops, that didn't go through. Please try again.",
      required: "Please tell us your name and whether you can come.",
      whatsappDone: "WhatsApp is open — just press send to deliver your reply.",
      emailDone: "Your email app is open — just press send to deliver your reply.",
      demo: "Demo mode — this reply wasn't sent anywhere.",
    },
    thanksYesTitle: "Merci, {name}!",
    thanksYes: "We can't wait to celebrate with you.",
    thanksNoTitle: "Thank you, {name}",
    thanksNo: "We'll miss you — thank you for letting us know.",
    postmark: "BORDEAUX",
  },

  /* Background music — add an mp3 to assets/ and write its path ("" = off) */
  music: {
    src: "",
    label: "Music",
  },

  footer: {
    kicker: "With love,",
    date: "19 · 06 · 2027",
    hashtag: "#AmelieEtJulien",
    // Optional credit line, e.g. { text: "Invitation by Studio Name", url: "https://…" }
    credit: { text: "", url: "" },
  },

  rsvpChip: "RSVP",
  musicLabels: { play: "Play music", pause: "Pause music" },
  lightbox: { close: "Close", prev: "Previous photo", next: "Next photo" },
};
