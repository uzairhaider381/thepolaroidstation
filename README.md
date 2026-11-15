# The Polaroid Station 📸 ✨
> *"The Instant Atelier Of Memories"*

A lightweight, vintage, aesthetic marketing website and instant booking portal for **The Polaroid Station** — an event Polaroid photo corner service based in Lahore, Pakistan.

- **Instagram**: [https://www.instagram.com/thepolaroidstation_](https://www.instagram.com/thepolaroidstation_)
- **Booking Recipient**: `planwithmaham@gmail.com`

---

## 🌸 Features & Highlights

- **Aesthetic Vintage Atelier Design**: Warm cream (`#F8F2E7`), blush rose (`#F2CFC8`), sepia tones, washi tape pieces, and authentic Polaroid-styled card frames.
- **Packages & Pricing Section (`#packages`)**:
  - **Standard Package** (*Featured*): **PKR 40,000** for 40 instant films (Polaroids), instant camera, 2 instructors/team members, keepsake guest book, and complete station setup. Animated price tag wiggle.
  - **Custom Package**: Customizable film count, mini cards or guest book, tailored event sizing. Pricing on request.
  - One-click CTA buttons that smooth-scroll to `#book` and automatically pre-select the chosen package.
- **Terms & Conditions Section (`#terms`)**:
  - Accessible, smooth-animated 5-item accordion styled as a gentle reminder notebook note.
  - Highlights critical policies (advance payment non-refundable, first-paid first-confirmed basis, content delivery in 24 hours, re-edits in 15 days).
- **Upgraded Booking Form (`#book`)**:
  - Dynamic package selection with live estimated price calculation.
  - Locked 40-polaroid count on Standard, customizable on Custom.
  - Add-on selector (Guest Book, Mini Cards, Both, None).
  - Crucial advance payment reminder notice box.
  - Mandatory Terms & Conditions acceptance checkbox that controls the submit button.
  - Camera flash effect and Polaroid "Thank You" modal card.
- **Micro-Animations & Visual Delight**:
  - Initial page load **Polaroid developing effect** (faded milky filter clears into crisp branding).
  - Floating Polaroid camera with interactive photo that slides out from the ejection slot.
  - Interactive camera click triggering a realistic screen flash.
  - Infinite marquee ribbon of event types (Weddings, Mehndi, Art Galleries, Pop-ups, etc.).
  - Self-drawing dotted SVG path connecting the 4 steps in "How It Works".
  - Polaroid cards with subtle tilts that straighten and elevate on hover.
  - Custom desktop sparkle cursor.
- **Zero Heavy Frameworks**: Pure HTML5, modern CSS3 (with CSS variables and `@media (prefers-reduced-motion)`), and vanilla JavaScript. Extremely fast loading and high Lighthouse scores.
- **Full Booking & Email System**:
  - Client-side validation + honeypot anti-spam protection.
  - Modern Vercel Serverless Function (`/api/book.js`) powered by `nodemailer` and Gmail SMTP.
  - Sends a beautifully formatted HTML booking summary to `planwithmaham@gmail.com` with one-click reply to the customer, package highlights, and terms acceptance timestamp in Pakistan Time (PKT).
  - Sends a warm branded confirmation email to the guest with advance payment reminder, order summary, and link to Terms.
  - In-memory rate limiting to prevent spam abuse.
- **Mobile-First Responsive Layout**: Optimized for Instagram visitors on phones, tablets, and desktops (360px+).

---

## 📁 Project Structure

```
maham/
├── index.html               # Main single-page marketing website
├── css/
│   └── style.css            # Custom vintage/aesthetic stylesheet
├── js/
│   └── main.js              # Vanilla JS interactions, animations, and booking handler
├── public/
│   └── images/
│       ├── camera.png       # Transparent hero Polaroid camera
│       ├── logo.png         # Circular Polaroid Station logo (transparent PNG)
│       ├── favicon.png      # 64x64 browser favicon
│       └── placeholders/    # Lightweight SVG placeholders (setup, guestbook, gallery)
├── api/
│   └── book.js              # Vercel Serverless Function (Nodemailer Gmail SMTP)
├── package.json             # Nodemailer dependency
├── vercel.json              # Vercel security headers and caching configuration
├── .env.example             # Environment variable template
└── README.md                # Documentation & deployment guide
```

---

## 🚀 Deployment to Vercel (Step-by-Step)

The project is fully pre-configured for one-click deployment on [Vercel](https://vercel.com).

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Update: Add packages, terms accordion, and upgraded booking flow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/the-polaroid-station.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Select your `the-polaroid-station` GitHub repository.
4. Framework Preset: Leave as **Other** (Vercel automatically detects static files and `/api` serverless functions).
5. Click **Deploy**.

---

## 🔑 Setting up Gmail SMTP for Booking Emails

The booking form sends inquiries directly to `planwithmaham@gmail.com`. Google requires an **App Password** for automated SMTP:

### Step 1: Create a Gmail App Password
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. In the search bar at the top or under Security, search for **App passwords** (or go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Enter an app name (e.g. `The Polaroid Station Website`) and click **Create**.
5. Copy the 16-character passcode shown (e.g., `abcd efgh ijkl mnop`).

### Step 2: Add Environment Variables in Vercel
1. In your Vercel Project Dashboard, navigate to **Settings** → **Environment Variables**.
2. Add the following keys:
   - `GMAIL_USER`: Your sending Gmail address (e.g. `yourname@gmail.com`).
   - `GMAIL_APP_PASSWORD`: The 16-character App Password (without spaces).
   - `BOOKING_TO`: `planwithmaham@gmail.com`
   - `SITE_URL`: `https://thepolaroidstation.vercel.app` (or your custom domain)
3. Click **Save** and trigger a **Redeploy** (Deployments → Redeploy).

> **Note**: In local development or preview without environment variables, `/api/book.js` operates in preview mode, acknowledging the request without throwing errors.

---

## 🖼️ Replacing Placeholders with Real Photos

The codebase includes clear comments wherever images can be customized:

1. **Station Setup & Collage Photos** (`index.html` lines ~220–250):
   - Replace `public/images/placeholders/setup.svg` with your actual photo (e.g. `public/images/setup.jpg`).
   - Replace `public/images/placeholders/guestbook.svg` with your guestbook photo.
2. **Gallery Moments** (`index.html` lines ~430–500):
   - Drop your JPEG/WebP photos into `public/images/gallery/` and update the `src` attribute in the respective `.gallery-card` elements.
3. **Guest Reviews** (`index.html` lines ~530–580):
   - Replace the placeholder text inside `.sticky-quote` with genuine messages from your Instagram "Reviews" highlight.

---

## 💻 Local Preview

You can preview the website using any local static file server:

```bash
# Using Python
python -m http.server 3000

# Using Node / npx
npx serve .

# Or using Vercel CLI to test the /api serverless function locally
npx vercel dev
```

Then visit `http://localhost:3000` in your browser.

---

## 🤍 Credits & License

- Designed and built for **The Polaroid Station** (Lahore, Pakistan).
- Copyright © 2026 The Polaroid Station. All rights reserved.
- *"Made with love & a little flash ✨"*
