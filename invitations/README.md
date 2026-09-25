# Animated Wedding Invitations — Bordeaux & Olive

Two ready-to-sell animated wedding invitation websites. Each one is a single
folder of plain HTML/CSS/JS: no framework, no build step, nothing to install.

| Design | Style | Opening animation |
| --- | --- | --- |
| **Bordeaux** (`bordeaux/`) | Burgundy scrapbook: photo-booth prints, pinned note, twine bow, instant camera | Velvet-red envelope, wax seal breaks, letter slides out, petals |
| **Olive** (`olive/`) | Olive & ivory editorial: misty lake, swans, scalloped photo, gold seal | Gatefold card with a monogram crest that draws itself, doors swing open |

Both include a live countdown, add-to-calendar (Google / Apple / Outlook),
map links, schedule, gallery with lightbox, RSVP form, optional background
music, personal guest links (`?to=Name`), link-preview image, mobile-first
layout, and reduced-motion support.

```
invitations/
├── index.html          # showcase page to send to customers (live demos inside phone frames)
├── guest-links.html    # tool: turn a guest list into personal links + WhatsApp messages
├── bordeaux/
│   ├── config.js       # ← every text, date, photo and setting lives here
│   ├── index.html
│   ├── css/style.css
│   ├── js/invite.js
│   └── assets/         # photos/ + share.jpg (link preview image)
└── olive/              # same structure
```

## Try it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/invitations/
```

Opening `index.html` straight from the file system also works. Only the
"Add to calendar" download and the RSVP `endpoint` need a real web server.

## Make an invitation for a client (≈10 minutes)

1. **Copy the design folder**, e.g. `bordeaux/` → `amelie-julien/`.
2. **Edit `config.js`.** Names, date/time (with time-zone offset), venues,
   schedule, story, FAQ, colours for the dress code, RSVP settings. Every
   field has a comment. Use `\n` for a line break; set an optional section to
   `null` to hide it.
3. **Replace the photos.** The demos use free Pexels photos, linked by URL, as
   placeholders. Put the couple's photos in `assets/photos/` and write their
   paths in `config.js` (e.g. `"assets/photos/kiss.jpg"`). Compress them to about
   1600px wide (~200 KB) for fast loading.
   - Bordeaux turns the photo-booth strip and bottom-left photo black & white
     automatically. Set `hero.blackAndWhite: false` to keep colour.
   - Olive has two hero photos: `photoWide` (computers) and `photoTall`
     (phones). `hero.swans: true` adds two animated drawn swans on the water,
     nice over a plain lake or landscape photo.
4. **Edit the `<title>` and `og:` tags** at the top of `index.html`. These
   control the text shown when the link is shared on WhatsApp, iMessage or
   Instagram. Once online, change `og:image` to the full address, e.g.
   `https://yoursite.com/amelie-julien/assets/share.jpg`.
5. **Publish** (see below) and send the link.

### Personal links for every guest

Add `?to=` to the link and the envelope or cover greets that guest by name:

```
https://yoursite.com/amelie-julien/?to=Sophie%20%26%20Tom
```

Open `guest-links.html` to do this for a whole guest list. It creates
one link per guest, a ready-to-send WhatsApp message, and a CSV. The name is
also pre-filled in the RSVP form.

Deep links like `…/#rsvp` or `…/#details` skip the opening animation and
jump straight to that section, which is useful for reminders.

## Collecting RSVPs

In `config.js → rsvp`, fill **one** of these. They are checked in this order:

| Option | Setting | Best for |
| --- | --- | --- |
| Google Sheets | `endpoint: "https://script.google.com/macros/s/…/exec"` | Free, unlimited, a live spreadsheet for the couple |
| Formspree | `endpoint: "https://formspree.io/f/xxxxxxx"` | 2-minute setup, email notification per reply |
| WhatsApp | `whatsapp: "33612345678"` | Replies arrive as a WhatsApp message to the couple |
| Email | `email: "couple@example.com"` | Opens the guest's mail app with the reply pre-written |
| Demo | leave all three empty | Showcasing. **Nothing is sent**, and the page says so |

Every reply includes: `sent_at, name, email (Olive), attending, guests, diet,
song, message, link_name, invitation`.

### Google Sheets setup (recommended)

1. Create a Google Sheet → **Extensions → Apps Script**, paste this and save:

   ```js
   const HEADERS = ["sent_at", "name", "email", "attending", "guests", "diet", "song", "message", "link_name", "invitation"];

   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.waitLock(10000);
     try {
       const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
       if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
       sheet.appendRow(HEADERS.map((h) => e.parameter[h] || ""));
       return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
     } finally {
       lock.releaseLock();
     }
   }
   ```

2. **Deploy → New deployment → Web app**. Set *Execute as: Me* and *Who has
   access: Anyone*. Authorise it.
3. Copy the web-app URL (ending in `/exec`) into `rsvp.endpoint`.
4. Send a test reply from the published invitation. A row appears in the sheet.

You can share the sheet with the couple so they can follow replies live.

## Publishing

Any static host works. Upload the design folder, or the whole `invitations/` folder:

- **Netlify Drop**: drag the folder onto app.netlify.com/drop. You get a free link in seconds.
- **GitHub Pages**: this repo already has a Pages workflow
  (`.github/workflows/deploy-pages.yml`). Add your branch to its `on.push.branches`
  list and the site is published at `https://<user>.github.io/<repo>/invitations/`.
- **Vercel / Cloudflare Pages**: import the repo, no build command, output directory `/`.

Connect a custom domain (e.g. `amelieandjulien.com`) in the host's settings
for an extra-premium touch.

## Music

Add an mp3 (a track you have the rights to use) to `assets/`, then set
`music: { src: "assets/our-song.mp3" }`. It starts when the guest opens the
envelope; a floating button pauses and resumes it. If `src` is empty, the
button doesn't appear.

## Fonts & privacy

Fonts load from Google Fonts. For EU clients who want no third-party
requests, download the fonts from fonts.google.com (all are under the Open
Font License). Put them in `assets/fonts/`, add `@font-face` rules and remove
the `<link>` to fonts.googleapis.com.

| Design | Fonts |
| --- | --- |
| Bordeaux | Great Vibes, La Belle Aurore, Playfair Display, Montserrat |
| Olive | Pinyon Script, Cormorant Garamond, Cinzel |

## Customising the look

Colours are CSS variables at the top of each `css/style.css`
(`--wine`, `--claret`, `--olive`, `--gold`…). Change a few hex codes to create a
new colourway, e.g. a navy Bordeaux or a blush Olive, and sell it as a variant.

## Selling checklist

- Showcase: publish `invitations/`, set your brand and contact details in the
  `STUDIO` block at the bottom of `index.html`, and send that link to customers.
- Ask each client for: names, date & time, ceremony/reception venues and addresses,
  schedule, story (3 short moments), 6–10 photos, dress-code colours, RSVP deadline,
  RSVP method (Sheets / WhatsApp / email), FAQ answers, optional song.
- Deliver: a preview link to approve, the final link, and the `guest-links.html` tool.
- Screen-record the opening animation on a phone for Etsy, Instagram or TikTok listings.

## Canva versions

`canva/bordeaux.html` and `canva/olive.html` are static, page-by-page versions
of both designs (1366×768 website pages). Canva imports them as editable
website designs. Use them to sell Canva templates, or to let a client edit the
text themselves.

## About the demo photos

The demo photos are free stock photos from [Pexels](https://www.pexels.com),
linked directly by URL (see `config.js`). The Pexels license allows free
commercial use without attribution. You may not sell the photos themselves,
and the people in them must not appear to endorse your product. They are
placeholders only: every client order uses the couple's own photos, saved in
`assets/photos/`.

To swap a demo photo, open it on pexels.com and copy its number from the
address (e.g. `…/photo/two-cups-of-coffee-on-table-2575835/` → `2575835`). Then use:

```
https://images.pexels.com/photos/2575835/pexels-photo-2575835.jpeg?auto=compress&cs=tinysrgb&w=1200
```

`assets/share.jpg` (the link-preview image) is a render of the invitation's own
envelope or cover, so you can keep it for every client.
