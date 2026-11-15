/**
 * Vercel Serverless Function: /api/book
 * Handles event booking form submissions for "The Polaroid Station" (Lahore, Pakistan).
 * Sends an email notification to the owner (planwithmaham@gmail.com) and a confirmation to the guest.
 */

const nodemailer = require('nodemailer');

// In-memory rate limiting map: ip -> [timestamps]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

/**
 * Clean up old rate limit entries periodically
 */
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
}

/**
 * Escape HTML to prevent injection in generated email templates
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return typeof email === 'string' && email.length <= 150 && emailRegex.test(email);
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Please send a POST request with JSON payload.'
    });
  }

  try {
    // 1. IP Rate Limiting
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown-ip');
    
    cleanupRateLimitMap();
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recentRequests = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        success: false,
        error: 'Too many booking attempts from this device. Please wait a few minutes or DM us directly on Instagram @thepolaroidstation_.'
      });
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);

    // 2. Parse payload
    const body = req.body || {};
    const {
      name,
      email,
      phone,
      eventType,
      eventDate,
      eventCity = 'Lahore',
      package: packageChoice = 'standard',
      polaroidsCount = 40,
      addOn = 'Guest Book',
      termsAccepted = false,
      guestCount = '',
      message = '',
      website_hp = '' // Anti-spam honeypot
    } = body;

    // 3. Honeypot check (silently drop bot submissions)
    if (website_hp && String(website_hp).trim().length > 0) {
      // Return 200 OK to fool automated spam bots
      return res.status(200).json({
        success: true,
        message: 'Thank you! We have received your request.'
      });
    }

    // 4. Validate Terms & Conditions acceptance
    if (termsAccepted !== true && termsAccepted !== 'true' && termsAccepted !== 1 && termsAccepted !== '1') {
      return res.status(400).json({
        success: false,
        error: 'You must read and agree to the Terms & Conditions before submitting your booking request.'
      });
    }

    // 5. Validate required base fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide your full name (minimum 2 characters).' });
    }
    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Please provide a valid phone or WhatsApp number.' });
    }
    if (!eventType || typeof eventType !== 'string' || eventType.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Please select an event type.' });
    }
    if (!eventDate || typeof eventDate !== 'string') {
      return res.status(400).json({ success: false, error: 'Please select an event date.' });
    }

    // 6. Validate Package and Polaroid Count
    const normalizedPkg = String(packageChoice).toLowerCase().includes('custom') ? 'custom' : 'standard';
    let validatedPolaroids = 40;
    let displayPackage = 'Standard Package';
    let displayPrice = 'PKR 40,000';

    if (normalizedPkg === 'standard') {
      validatedPolaroids = 40;
      displayPackage = 'Standard Package – PKR 40,000 (40 Polaroids + Guest Book)';
      displayPrice = 'PKR 40,000';
    } else {
      const parsedCount = parseInt(polaroidsCount, 10);
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 3000) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid number of Polaroids needed (minimum 1).'
        });
      }
      validatedPolaroids = parsedCount;
      displayPackage = 'Custom Package (Tailored Quote)';
      displayPrice = 'Pricing on request (Custom Quote)';
    }

    // 7. Validate Add-on
    const allowedAddOns = ['Guest Book', 'Mini Cards', 'Both', 'None', 'Both (Guest Book & Mini Cards)'];
    let safeAddOn = allowedAddOns.includes(addOn) ? addOn : 'Guest Book';

    // Sanitize values
    const safeName = escapeHtml(name.trim().slice(0, 100));
    const safeEmail = email.trim().slice(0, 120);
    const safePhone = escapeHtml(phone.trim().slice(0, 40));
    const safeEventType = escapeHtml(eventType.trim().slice(0, 60));
    const safeEventDate = escapeHtml(eventDate.trim().slice(0, 30));
    const safeEventCity = escapeHtml(String(eventCity).trim().slice(0, 80) || 'Lahore');
    const safeGuestCount = escapeHtml(String(guestCount).trim().slice(0, 20) || 'Not specified');
    const safeMessage = escapeHtml(String(message).trim().slice(0, 1500) || 'None');
    safeAddOn = escapeHtml(safeAddOn);

    // Format Pakistan Time timestamp
    const pktTimestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'medium'
    }) + ' (PKT)';

    const bookingRecipient = process.env.BOOKING_TO || 'planwithmaham@gmail.com';
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const siteUrl = process.env.SITE_URL || 'https://thepolaroidstation.vercel.app';

    // 8. If credentials are not configured (e.g. initial demo/local preview)
    if (!gmailUser || !gmailAppPassword) {
      console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD is not configured in environment variables.');
      return res.status(200).json({
        success: true,
        preview: true,
        message: 'Thank you! We\'ve received your request and will contact you soon 💌 (Preview mode: Gmail credentials not yet set in environment variables).'
      });
    }

    // 9. Setup Nodemailer Transporter using Gmail SMTP
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // 10. Compose Email 1 -> Business Owner (Maham)
    const ownerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F2E7; margin: 0; padding: 24px; color: #1B1B1B; }
    .card { max-width: 620px; margin: 0 auto; background: #FFFDF8; border-radius: 16px; border: 1px solid rgba(27,27,27,0.1); box-shadow: 0 10px 25px rgba(27,27,27,0.08); overflow: hidden; }
    .header { background-color: #1B1B1B; color: #F8F2E7; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.85; color: #F2CFC8; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background-color: #F2CFC8; color: #1B1B1B; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 18px; }
    .highlight-box { background: #F8F2E7; border-left: 4px solid #DEABA1; padding: 14px 18px; border-radius: 6px; margin: 16px 0 20px 0; }
    .highlight-box h3 { margin: 0 0 4px; font-size: 16px; color: #1B1B1B; }
    .highlight-box p { margin: 0; font-size: 14px; color: #5C5751; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 12px 10px; border-bottom: 1px solid #ECEAE4; font-size: 14px; vertical-align: top; }
    td.label { width: 36%; font-weight: 600; color: #5C5751; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
    td.value { color: #1B1B1B; font-weight: 500; }
    .message-box { background: #F8F2E7; border-left: 4px solid #C9A98A; padding: 14px; border-radius: 6px; margin-top: 16px; font-style: italic; white-space: pre-wrap; font-size: 14px; }
    .terms-box { background: #E7EDE0; border: 1px solid #CBD5C0; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #1B1B1B; margin-top: 18px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #8C8780; border-top: 1px solid #ECEAE4; background: #FFFDF8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>THE POLAROID STATION</h1>
      <p>The Instant Atelier Of Memories ✨ · Lahore</p>
    </div>
    <div class="content">
      <span class="badge">📸 New Booking Request</span>
      <p style="font-size: 16px; margin-top: 0;">You have received a new station booking inquiry from <strong>${safeName}</strong>!</p>
      
      <!-- Package Highlight Box -->
      <div class="highlight-box">
        <h3>Selected Package: ${displayPackage}</h3>
        <p>Estimated Price: <strong>${displayPrice}</strong> · Polaroids: <strong>${validatedPolaroids}</strong> · Add-on: <strong>${safeAddOn}</strong></p>
      </div>

      <table>
        <tr>
          <td class="label">Full Name</td>
          <td class="value"><strong>${safeName}</strong></td>
        </tr>
        <tr>
          <td class="label">Package</td>
          <td class="value"><strong>${displayPackage}</strong></td>
        </tr>
        <tr>
          <td class="label">Estimated Price</td>
          <td class="value"><strong>${displayPrice}</strong></td>
        </tr>
        <tr>
          <td class="label">Polaroids Count</td>
          <td class="value">${validatedPolaroids} Films</td>
        </tr>
        <tr>
          <td class="label">Add-on Chosen</td>
          <td class="value">${safeAddOn}</td>
        </tr>
        <tr>
          <td class="label">Event Type</td>
          <td class="value">${safeEventType}</td>
        </tr>
        <tr>
          <td class="label">Event Date</td>
          <td class="value"><strong>${safeEventDate}</strong></td>
        </tr>
        <tr>
          <td class="label">City / Venue</td>
          <td class="value">${safeEventCity}</td>
        </tr>
        <tr>
          <td class="label">Phone / WhatsApp</td>
          <td class="value"><a href="https://wa.me/${safePhone.replace(/[^0-9]/g, '')}" style="color: #1B1B1B; text-decoration: underline;">${safePhone}</a></td>
        </tr>
        <tr>
          <td class="label">Customer Email</td>
          <td class="value"><a href="mailto:${safeEmail}" style="color: #1B1B1B; text-decoration: underline;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td class="label">Estimated Guests</td>
          <td class="value">${safeGuestCount}</td>
        </tr>
      </table>

      <p style="margin: 22px 0 6px; font-weight: 600; font-size: 13px; text-transform: uppercase; color: #5C5751;">Special Requests & Message:</p>
      <div class="message-box">${safeMessage}</div>

      <div class="terms-box">
        ✓ <strong>Terms & Conditions Accepted:</strong> Yes, by customer on ${pktTimestamp}.
      </div>
    </div>
    <div class="footer">
      Hit 'Reply' to respond directly to the customer at ${safeEmail}<br>
      © 2026 The Polaroid Station · Lahore, Pakistan
    </div>
  </div>
</body>
</html>
    `;

    // 11. Compose Email 2 -> Customer Confirmation
    const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Booking Request Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F2E7; margin: 0; padding: 24px; color: #1B1B1B; }
    .card { max-width: 600px; margin: 0 auto; background: #FFFDF8; border-radius: 16px; border: 1px solid rgba(27,27,27,0.1); box-shadow: 0 10px 25px rgba(27,27,27,0.08); overflow: hidden; }
    .header { background-color: #1B1B1B; color: #F8F2E7; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 0; font-size: 13px; color: #F2CFC8; }
    .content { padding: 28px 24px; line-height: 1.6; }
    .advance-notice-box { background-color: #FBECE8; border-left: 4px solid #DEABA1; padding: 14px 18px; border-radius: 6px; font-size: 14px; margin: 18px 0; color: #1B1B1B; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .summary-table td { padding: 8px 10px; border-bottom: 1px solid #ECEAE4; font-size: 14px; }
    .summary-table td.label { font-weight: 600; color: #5C5751; width: 40%; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #8C8780; border-top: 1px solid #ECEAE4; background: #FFFDF8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>THE POLAROID STATION</h1>
      <p>The Instant Atelier Of Memories ✨ · Lahore</p>
    </div>
    <div class="content">
      <h2 style="font-size: 20px; margin-top: 0;">Hi ${safeName}! 📸</h2>
      <p>Thank you for reaching out to <strong>The Polaroid Station</strong>. We have received your booking inquiry for your <strong>${safeEventType}</strong> on <strong>${safeEventDate}</strong> in <strong>${safeEventCity}</strong>.</p>
      
      <!-- Crucial Advance Payment Notice -->
      <div class="advance-notice-box">
        📌 <strong>Important Reminder:</strong> Your slot is <strong>NOT confirmed</strong> until the advance payment is received. Slots are booked on a first-paid, first-confirmed basis. Advance payment is non-refundable. We will contact you shortly with the next steps!
      </div>

      <h3 style="font-size: 15px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; color: #5C5751;">Summary of your request:</h3>
      <table class="summary-table">
        <tr>
          <td class="label">Package:</td>
          <td><strong>${displayPackage}</strong></td>
        </tr>
        <tr>
          <td class="label">Estimated Price:</td>
          <td><strong>${displayPrice}</strong></td>
        </tr>
        <tr>
          <td class="label">Number of Polaroids:</td>
          <td>${validatedPolaroids} Films</td>
        </tr>
        <tr>
          <td class="label">Add-on:</td>
          <td>${safeAddOn}</td>
        </tr>
        <tr>
          <td class="label">Event Date:</td>
          <td>${safeEventDate}</td>
        </tr>
        <tr>
          <td class="label">Venue / City:</td>
          <td>${safeEventCity}</td>
        </tr>
      </table>

      <p style="font-size: 13.5px; color: #5C5751; margin-top: 14px;">
        You can review our complete booking rules anytime on our website under <a href="${siteUrl}/#terms" style="color: #1B1B1B; font-weight: 600; text-decoration: underline;">Terms & Conditions</a>.
      </p>

      <p style="margin-top: 24px;">Warmly,<br><strong>Maham & The Polaroid Station Team</strong><br><span style="font-size: 13px; color: #8C8780;">Lahore, Pakistan · planwithmaham@gmail.com</span></p>
    </div>
    <div class="footer">
      Instagram: <a href="https://www.instagram.com/thepolaroidstation_" style="color: #1B1B1B;">@thepolaroidstation_</a><br>
      © 2026 The Polaroid Station. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    // 12. Send email to owner
    const subjectPackageName = normalizedPkg === 'standard' ? 'Standard Package' : 'Custom Package';
    await transporter.sendMail({
      from: `"The Polaroid Station Website" <${gmailUser}>`,
      to: bookingRecipient,
      replyTo: safeEmail,
      subject: `📸 New Booking Request – ${subjectPackageName} – ${safeEventType} on ${safeEventDate}`,
      text: `New Booking Request from ${safeName}\n\nPackage: ${displayPackage}\nEstimated Price: ${displayPrice}\nPolaroids: ${validatedPolaroids}\nAdd-on: ${safeAddOn}\nEmail: ${safeEmail}\nPhone: ${safePhone}\nEvent: ${safeEventType}\nDate: ${safeEventDate}\nVenue: ${safeEventCity}\nGuests: ${safeGuestCount}\nTerms Accepted: Yes (${pktTimestamp})\nMessage: ${safeMessage}`,
      html: ownerEmailHtml
    });

    // 13. Send polite confirmation email to customer
    try {
      await transporter.sendMail({
        from: `"The Polaroid Station" <${gmailUser}>`,
        to: safeEmail,
        subject: `We've received your booking request! ✨ – The Polaroid Station`,
        text: `Hi ${safeName},\n\nThank you for reaching out to The Polaroid Station. We have received your booking request for your ${safeEventType} on ${safeEventDate}.\n\nImportant Reminder: Your slot is NOT confirmed until the advance payment is received. Slots are booked on a first-paid, first-confirmed basis. Advance payment is non-refundable. We will contact you shortly with the next steps!\n\nPackage: ${displayPackage}\nEstimated Price: ${displayPrice}\nPolaroids: ${validatedPolaroids}\nAdd-on: ${safeAddOn}\n\nReview our Terms & Conditions at: ${siteUrl}/#terms\n\nWarmly,\nMaham & The Polaroid Station Team\nInstagram: @thepolaroidstation_`,
        html: customerEmailHtml
      });
    } catch (custEmailErr) {
      console.warn('Customer auto-confirmation email could not be delivered:', custEmailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you! We\'ve received your request and will contact you soon 💌'
    });

  } catch (error) {
    console.error('Serverless function error in /api/book:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while sending your booking request. Please try again or reach out on Instagram @thepolaroidstation_.'
    });
  }
};
