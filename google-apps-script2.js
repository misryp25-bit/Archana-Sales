/**
 * ════════════════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT — Archana Sales Enquiry Sheet Handler
 * ════════════════════════════════════════════════════════════
 *
 *  WHAT THIS DOES:
 *  1. Saves every website enquiry to Google Sheets
 *  2. Sends alert email to TWO team email addresses
 *  3. Sends a professional greeting/confirmation email to customer
 *
 *  ── HOW TO SET UP (one-time, ~5 minutes) ────────────────
 *
 *  STEP 1 — Create a Google Sheet
 *    • Go to sheets.google.com → New Spreadsheet
 *    • Name it: "Archana Sales – Enquiries"
 *    • Rename Sheet1 to "Enquiries"
 *    • The script will auto-create headers on first run.
 *
 *  STEP 2 — Open Apps Script
 *    • In the Sheet: click Extensions → Apps Script
 *    • Delete all existing code in the editor
 *    • Paste ONLY the code below the "── PASTE FROM HERE ──" line
 *    • Click Save (💾)
 *
 *  STEP 3 — Deploy as Web App
 *    • Click Deploy → New deployment
 *    • Gear ⚙ icon → Type: "Web app"
 *    • Execute as: "Me"
 *    • Who has access: "Anyone"   ← IMPORTANT
 *    • Click Deploy → Authorize → Allow
 *    • Copy the Web App URL (https://script.google.com/macros/s/.../exec)
 *
 *  STEP 4 — Paste URL in enquiry.js
 *    • Open enquiry.js → replace SHEET_WEBAPP_URL value with the URL
 *
 *  STEP 5 — Test it
 *    • In Apps Script editor, select "testDoPost" → click ▶ Run
 *    • Check your sheet for a test row, and your email for notifications
 *
 *  ── NOTES ───────────────────────────────────────────────
 *  • After editing this script, always redeploy:
 *    Deploy → Manage deployments → Edit → New version → Update
 *  • Customer greeting email only sends if customer provides their email.
 *  ────────────────────────────────────────────────────────
 */


// ════════════════════════════════════════════════════════════
// ── PASTE FROM HERE INTO GOOGLE APPS SCRIPT ─────────────────
// ════════════════════════════════════════════════════════════

// ── CONFIG — edit these values ───────────────────────────────

var SHEET_NAME = 'Enquiries'; // Google Sheet tab name

// Internal team notification emails (both receive every new enquiry alert)
var NOTIFY_EMAIL_1 = 'archanasales.ryp@gmail.com';   // Primary
var NOTIFY_EMAIL_2 = 'manojmittal@archanasales.co.in';        // ← Replace with 2nd email

// Set false to turn off internal team notifications
var SEND_TEAM_NOTIFICATION = true;

// Set false to turn off customer greeting emails
var SEND_CUSTOMER_GREETING = true;

// Your business details (used in the greeting email)
var BUSINESS_NAME    = 'Archana Sales';
var BUSINESS_PHONE   = '9425508151 / 6262825251';
var BUSINESS_EMAIL   = 'archanasales.ryp@gmail.com / manojmittal@archanasales.co.in';
var BUSINESS_ADDRESS = 'Off No. 3-4, Srishti Garden Commercial Complex, Ring Road No.1, Telibandha, Raipur (C.G.) – 492001';
var BUSINESS_WEBSITE = 'https://archanasales.co.in/'; // update if you have a domain


// ── doPost — main entry point ────────────────────────────────
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    // 1. Save to sheet
    saveToSheet(data);

    // 2. Notify internal team (both emails)
    if (SEND_TEAM_NOTIFICATION) sendTeamNotification(data);

    // 3. Send greeting to customer (if they provided email)
    if (SEND_CUSTOMER_GREETING && data.email) sendCustomerGreeting(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── doGet — browser test endpoint ────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Archana Sales Enquiry API is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════════
// 1. SAVE TO GOOGLE SHEET
// ════════════════════════════════════════════════════════════
function saveToSheet(data) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = ['Timestamp','Name','Phone','Email','Product','Quantity','City','Message','Source'];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a3c6e');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    data.name      || '',
    data.phone     || '',
    data.email     || '',
    data.product   || '',
    data.quantity  || '',
    data.city      || '',
    data.message   || '',
    data.source    || 'Website Form',
  ]);

  sheet.autoResizeColumns(1, 9);
}


// ════════════════════════════════════════════════════════════
// 2. INTERNAL TEAM NOTIFICATION — sent to both email IDs
// ════════════════════════════════════════════════════════════
function sendTeamNotification(data) {
  try {
    var subject = '📋 New Enquiry: ' + (data.name || 'Website Visitor') + ' — ' + (data.product || 'Product enquiry');

    var htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">' +
      '<div style="background:#1a3c6e;padding:20px 28px;border-radius:8px 8px 0 0;">' +
      '  <h2 style="color:#fff;margin:0;font-size:20px;">📋 New Enquiry Received</h2>' +
      '  <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">' + (data.timestamp || '') + '</p>' +
      '</div>' +
      '<div style="background:#f8fafd;padding:24px 28px;border:1px solid #e2eaf4;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
      row('👤 Name',     data.name)     +
      row('📞 Phone',    data.phone)    +
      row('✉ Email',    data.email || '—')    +
      row('🏷 Product',  data.product)  +
      row('📦 Quantity', data.quantity || '—') +
      row('📍 City',     data.city     || '—') +
      '</table>' +
      (data.message ?
        '<div style="margin-top:16px;background:#fff;border-left:4px solid #1a3c6e;padding:12px 16px;border-radius:0 6px 6px 0;">' +
        '<strong style="color:#1a3c6e;font-size:13px;">📝 Message / Requirements:</strong>' +
        '<p style="margin:8px 0 0;color:#333;font-size:14px;line-height:1.6;">' + data.message + '</p>' +
        '</div>' : '') +
      '</div>' +
      '<div style="background:#fff;padding:16px 28px;border:1px solid #e2eaf4;border-top:none;border-radius:0 0 8px 8px;text-align:center;">' +
      '<a href="https://wa.me/91' + (data.phone || '') + '" style="display:inline-block;background:#25d366;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;margin-right:10px;">📱 WhatsApp Customer</a>' +
      (data.email ? '<a href="mailto:' + data.email + '" style="display:inline-block;background:#1a3c6e;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:13px;">✉ Reply by Email</a>' : '') +
      '<br/><br/>' +
      '<a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" style="font-size:12px;color:#1a3c6e;">View All Enquiries in Google Sheets →</a>' +
      '</div>' +
      '</div>';

    var plainBody =
      'New Enquiry — Archana Sales\n\n' +
      'Name:     ' + (data.name     || '—') + '\n' +
      'Phone:    ' + (data.phone    || '—') + '\n' +
      'Email:    ' + (data.email    || '—') + '\n' +
      'Product:  ' + (data.product  || '—') + '\n' +
      'Quantity: ' + (data.quantity || '—') + '\n' +
      'City:     ' + (data.city     || '—') + '\n' +
      'Message:  ' + (data.message  || '—') + '\n\n' +
      'Time: '     + (data.timestamp || '') + '\n\n' +
      'Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();

    var recipients = [NOTIFY_EMAIL_1];
    if (NOTIFY_EMAIL_2 && NOTIFY_EMAIL_2 !== 'YOUR_SECOND_EMAIL_HERE') {
      recipients.push(NOTIFY_EMAIL_2);
    }

    recipients.forEach(function(email) {
      MailApp.sendEmail({
        to:       email,
        subject:  subject,
        body:     plainBody,
        htmlBody: htmlBody,
      });
    });

  } catch (err) {
    Logger.log('Team notification failed: ' + err.toString());
  }
}

// Helper — builds a table row for the notification email
function row(label, value) {
  return '<tr>' +
    '<td style="padding:8px 12px 8px 0;color:#5a6a80;font-weight:600;white-space:nowrap;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:8px 0;color:#1a2a3a;font-weight:500;">' + (value || '—') + '</td>' +
    '</tr>';
}


// ════════════════════════════════════════════════════════════
// 3. CUSTOMER GREETING / CONFIRMATION EMAIL
// ════════════════════════════════════════════════════════════
function sendCustomerGreeting(data) {
  try {
    var customerName = data.name ? data.name.split(' ')[0] : 'there'; // first name only

    var subject = 'Thank you for your enquiry, ' + customerName + '! — ' + BUSINESS_NAME;

    var htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;">' +

      // Header
      '<div style="background:linear-gradient(135deg,#0b1e3f,#1a3c6e);padding:32px 36px;border-radius:10px 10px 0 0;text-align:center;">' +
      '  <h1 style="color:#fff;margin:0 0 4px;font-size:24px;letter-spacing:-0.5px;">' + BUSINESS_NAME + '</h1>' +
      '  <p style="color:rgba(255,255,255,0.65);margin:0;font-size:13px;letter-spacing:1px;">OFFICIAL DEALER & DISTRIBUTOR — RAIPUR, C.G.</p>' +
      '</div>' +

      // Greeting band
      '<div style="background:#e8930a;padding:14px 36px;">' +
      '  <p style="margin:0;color:#fff;font-size:15px;font-weight:700;">✅ Your Enquiry Has Been Received!</p>' +
      '</div>' +

      // Body
      '<div style="padding:32px 36px;border:1px solid #e2eaf4;border-top:none;">' +
      '  <p style="font-size:16px;color:#1a2a3a;margin:0 0 16px;">Dear <strong>' + (data.name || 'Valued Customer') + '</strong>,</p>' +
      '  <p style="font-size:14px;color:#3a4a60;line-height:1.7;margin:0 0 16px;">' +
      '    Thank you for reaching out to us! We have successfully received your enquiry for ' +
      '    <strong style="color:#1a3c6e;">' + (data.product || 'our products') + '</strong> ' +
      '    and our team is already reviewing your requirements.' +
      '  </p>' +
      '  <p style="font-size:14px;color:#3a4a60;line-height:1.7;margin:0 0 24px;">' +
      '    We will contact you within <strong>24 hours</strong> on your mobile number ' +
      '    <strong>' + (data.phone || 'provided') + '</strong> with the best pricing and availability.' +
      '  </p>' +

      // Enquiry summary box
      '  <div style="background:#f0f5ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;">' +
      '    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1a3c6e;letter-spacing:1px;text-transform:uppercase;">Your Enquiry Summary</p>' +
      '    <table style="width:100%;font-size:13px;border-collapse:collapse;">' +
      summaryRow('Product / Brand', data.product) +
      (data.quantity ? summaryRow('Quantity', data.quantity) : '') +
      (data.city     ? summaryRow('Delivery City', data.city) : '') +
      (data.message  ? summaryRow('Your Note', data.message) : '') +
      '    </table>' +
      '  </div>' +

      // Why choose us
      '  <div style="border-left:4px solid #e8930a;padding:12px 18px;background:#fffaf3;border-radius:0 8px 8px 0;margin-bottom:24px;">' +
      '    <p style="margin:0;font-size:13px;color:#7a5a00;font-weight:600;">Why customers choose Archana Sales:</p>' +
      '    <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#5a4a30;line-height:1.8;">' +
      '      <li>✅ 100% Genuine & Authorised Products</li>' +
      '      <li>✅ Best Pricing — Direct Dealer Rates</li>' +
      '      <li>✅ Fast Delivery Across Chhattisgarh</li>' +
      '      <li>✅ Free Technical Consultation</li>' +
      '      <li>✅ 15+ Years of Trusted Service</li>' +
      '    </ul>' +
      '  </div>' +

      // CTA buttons
      '  <div style="text-align:center;margin-bottom:24px;">' +
      '    <p style="font-size:13px;color:#5a6a80;margin:0 0 14px;">Need a faster response? Reach us directly:</p>' +
      '    <a href="https://wa.me/91' + BUSINESS_PHONE.replace(/[^0-9]/g,'').slice(-10) + '" ' +
      '       style="display:inline-block;background:#25d366;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:0 6px 10px;">📱 WhatsApp Us</a>' +
      '    <a href="tel:+919425508151" ' +
      '       style="display:inline-block;background:#1a3c6e;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:0 6px 10px;">📞 Call Now</a>' +
      '  </div>' +

      '  <p style="font-size:13px;color:#8a9ab0;text-align:center;margin:0;">We look forward to serving you. 🙏</p>' +
      '</div>' +

      // Footer
      '<div style="background:#f8fafd;padding:20px 36px;border:1px solid #e2eaf4;border-top:none;border-radius:0 0 10px 10px;">' +
      '  <table style="width:100%;font-size:12px;color:#5a6a80;">' +
      '    <tr><td>📍 ' + BUSINESS_ADDRESS + '</td></tr>' +
      '    <tr><td style="padding-top:6px;">📞 ' + BUSINESS_PHONE + '&nbsp;&nbsp;|&nbsp;&nbsp;✉ ' + BUSINESS_EMAIL + '</td></tr>' +
      '  </table>' +
      '  <p style="margin:14px 0 0;font-size:11px;color:#aab0be;text-align:center;">' +
      '    You received this email because you submitted an enquiry on our website. ' +
      '    This is an automated confirmation — please do not reply to this email.' +
      '  </p>' +
      '</div>' +
      '</div>';

    var plainBody =
      'Dear ' + (data.name || 'Customer') + ',\n\n' +
      'Thank you for your enquiry with ' + BUSINESS_NAME + '!\n\n' +
      'We have received your enquiry for: ' + (data.product || 'our products') + '\n\n' +
      'Our team will contact you within 24 hours on ' + (data.phone || 'your mobile') + '.\n\n' +
      '── ENQUIRY SUMMARY ──\n' +
      'Product:  ' + (data.product  || '—') + '\n' +
      'Quantity: ' + (data.quantity || '—') + '\n' +
      'City:     ' + (data.city     || '—') + '\n' +
      'Message:  ' + (data.message  || '—') + '\n\n' +
      '── CONTACT US ──\n' +
      BUSINESS_NAME + '\n' +
      'Phone: ' + BUSINESS_PHONE + '\n' +
      'Email: ' + BUSINESS_EMAIL + '\n' +
      'Address: ' + BUSINESS_ADDRESS + '\n\n' +
      'We look forward to serving you!\n\n' +
      'This is an automated confirmation. Please do not reply to this email.';

    MailApp.sendEmail({
      to:       data.email,
      subject:  subject,
      body:     plainBody,
      htmlBody: htmlBody,
    });

  } catch (err) {
    Logger.log('Customer greeting failed: ' + err.toString());
  }
}

// Helper — summary table row for greeting email
function summaryRow(label, value) {
  if (!value) return '';
  return '<tr>' +
    '<td style="padding:5px 12px 5px 0;color:#5a6a80;font-weight:600;white-space:nowrap;vertical-align:top;width:120px;">' + label + ':</td>' +
    '<td style="padding:5px 0;color:#1a2a3a;">' + value + '</td>' +
    '</tr>';
}


// ════════════════════════════════════════════════════════════
// TEST — select this function in editor and click ▶ Run
// ════════════════════════════════════════════════════════════
function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        name:      'Rajesh Kumar',
        phone:     '9876543210',
        email:     'rajesh.test@gmail.com', // ← change to your email to preview the greeting
        product:   'Asian Paints – Interior Paints',
        quantity:  '20 litres',
        city:      'Raipur',
        message:   'Need Royale Shyne for a 3BHK flat painting project.',
        source:    'Manual Test',
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log('Result: ' + result.getContent());
  Logger.log('Check your sheet and email inbox!');
}
