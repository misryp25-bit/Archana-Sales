/**
 * ════════════════════════════════════════════════════════════
 *  GOOGLE APPS SCRIPT — Archana Sales Enquiry Sheet Handler
 * ════════════════════════════════════════════════════════════
 *
 *  WHAT THIS DOES:
 *  Receives POST data from the website enquiry form and
 *  appends a new row to your Google Sheet automatically.
 *
 *  ── HOW TO SET UP (one-time, ~5 minutes) ────────────────
 *
 *  STEP 1 — Create a Google Sheet
 *    • Go to sheets.google.com → New Spreadsheet
 *    • Name it: "Archana Sales – Enquiries"
 *    • Rename Sheet1 to "Enquiries"
 *    • Add these headers in Row 1:
 *        A1: Timestamp
 *        B1: Name
 *        C1: Phone
 *        D1: Email
 *        E1: Product
 *        F1: Quantity
 *        G1: City
 *        H1: Message
 *        I1: Source
 *
 *  STEP 2 — Open Apps Script
 *    • In the Sheet: click Extensions → Apps Script
 *    • Delete all existing code
 *    • Paste the entire code below (starting from the line
 *      "// ── APPS SCRIPT CODE ──" further down this file)
 *    • Click Save (💾)
 *
 *  STEP 3 — Deploy as Web App
 *    • Click Deploy → New deployment
 *    • Click the gear ⚙ icon → Select type: "Web app"
 *    • Description: "Archana Sales Enquiry Handler"
 *    • Execute as: "Me (your Google account)"
 *    • Who has access: "Anyone"   ← IMPORTANT
 *    • Click Deploy → Authorize → Allow
 *    • COPY the Web App URL shown (it looks like:
 *        https://script.google.com/macros/s/AKfycby.../exec)
 *
 *  STEP 4 — Paste the URL in enquiry.js
 *    • Open enquiry.js
 *    • Replace 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
 *      with the URL you just copied
 *    • Save enquiry.js
 *
 *  STEP 5 — Test
 *    • Open your website → fill the enquiry form → submit
 *    • Check your Google Sheet — a new row should appear!
 *
 *  ── NOTES ───────────────────────────────────────────────
 *  • Every time you EDIT the script you must create a
 *    NEW deployment (Deploy → New deployment) to get a
 *    fresh URL, OR click "Manage deployments" → edit the
 *    existing one → change version to "New version" → Update.
 *  • The sheet will auto-sort newest entries at the bottom.
 *  • You can share the sheet with your team from Google Sheets.
 *  ────────────────────────────────────────────────────────
 */


// ── APPS SCRIPT CODE ─────────────────────────────────────────
// Copy everything below this line into Google Apps Script editor

var SHEET_NAME = 'Enquiries'; // must match your sheet tab name

/**
 * doPost — runs when the website form submits data.
 * Parses the JSON body and appends a row to the sheet.
 */
function doPost(e) {
  try {
    // Parse the JSON data sent from the website
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    // Open the active spreadsheet and find the correct sheet
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Create the sheet if it doesn't exist yet
      sheet = ss.insertSheet(SHEET_NAME);
      // Write header row
      sheet.appendRow([
        'Timestamp', 'Name', 'Phone', 'Email',
        'Product', 'Quantity', 'City', 'Message', 'Source'
      ]);
      // Bold + freeze the header
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Build the row to append
    var row = [
      data.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      data.name      || '',
      data.phone     || '',
      data.email     || '',
      data.product   || '',
      data.quantity  || '',
      data.city      || '',
      data.message   || '',
      data.source    || 'Website Form',
    ];

    sheet.appendRow(row);

    // Auto-resize columns for readability (optional)
    sheet.autoResizeColumns(1, 9);

    // Optional: Send email notification to yourself
    sendNotificationEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log the error and return a failure response
    Logger.log('Error in doPost: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doGet — handles GET requests (useful for testing the URL in browser).
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Archana Sales Enquiry API is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * sendNotificationEmail — sends a quick email alert to your inbox
 * whenever a new enquiry arrives. Set NOTIFY_EMAIL to your address.
 * Set SEND_EMAIL = false to disable.
 */
var SEND_EMAIL   = true;
var NOTIFY_EMAIL = 'archanasales.ryp@gmail.com'; // ← change if needed

function sendNotificationEmail(data) {
  if (!SEND_EMAIL) return;

  try {
    var subject = '📋 New Enquiry from ' + (data.name || 'Website Visitor') + ' — Archana Sales';
    var body =
      'New Enquiry Received!\n\n' +
      'Name:     ' + (data.name     || '-') + '\n' +
      'Phone:    ' + (data.phone    || '-') + '\n' +
      'Email:    ' + (data.email    || '-') + '\n' +
      'Product:  ' + (data.product  || '-') + '\n' +
      'Quantity: ' + (data.quantity || '-') + '\n' +
      'City:     ' + (data.city     || '-') + '\n' +
      'Message:  ' + (data.message  || '-') + '\n\n' +
      'Time: '     + (data.timestamp || new Date().toString()) + '\n\n' +
      'View all enquiries in Google Sheets:\n' +
      SpreadsheetApp.getActiveSpreadsheet().getUrl();

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
  } catch (mailErr) {
    Logger.log('Email notification failed: ' + mailErr.toString());
  }
}

/**
 * testDoPost — run this function manually from the Apps Script editor
 * to verify the setup is working before going live.
 */
function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        name:     'Test User',
        phone:    '9876543210',
        email:    'test@example.com',
        product:  'Asian Paints – Interior Paints',
        quantity: '10 litres',
        city:     'Raipur',
        message:  'This is a test enquiry from Apps Script.',
        source:   'Manual Test',
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
