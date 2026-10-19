/**
 * enquiry.js — Archana Sales
 * Handles the "Send an Enquiry" form:
 *   1. Validates all fields (live, as the user types)
 *   2. Sends data to Google Sheets via the Google Apps Script web app
 *   3. Shows an inline success message — the page never navigates away
 *      and no WhatsApp tab is opened.
 *
 * ── SETUP ──────────────────────────────────────────────────
 * SHEET_WEBAPP_URL below is the deployed Google Apps Script Web App URL.
 * See: google-apps-script1.js / google-apps-script2.js for the script deployed.
 * ⚠ DO NOT CHANGE the config block or the `data` object keys below —
 *   the Google Sheet columns are matched to those exact names.
 * ───────────────────────────────────────────────────────────
 */

// ── CONFIG ──────────────────────────────────────────────────
// ⚠ UNCHANGED — Google Sheets configuration
const SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby1yQGSUkIlcCV_fGWpsCD9TdrlZcT9pCIQ0axRiE8PYNB98-ZqVde2i9c5EO_SY5HplQ/exec';
// e.g. 'https://script.google.com/macros/s/AKfycby.../exec'


// ── MAIN SUBMIT HANDLER ─────────────────────────────────────
function submitEnquiry(e) {
  e.preventDefault();

  // Collect field values
  const fields = {
    name:    document.getElementById('enq-name'),
    phone:   document.getElementById('enq-phone'),
    email:   document.getElementById('enq-email'),
    product: document.getElementById('enq-product'),
    qty:     document.getElementById('enq-qty'),
    city:    document.getElementById('enq-city'),
    message: document.getElementById('enq-message'),
  };

  // ⚠ Key names below must match the Google Sheet columns — do not rename.
  const data = {
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    name:      fields.name.value.trim(),
    phone:     fields.phone.value.trim(),
    email:     fields.email.value.trim(),
    product:   fields.product.value,
    quantity:  fields.qty    ? fields.qty.value.trim()  : '',
    city:      fields.city   ? fields.city.value.trim() : '',
    message:   fields.message ? fields.message.value.trim() : '',
    source:    'Website Enquiry Form',
  };

  // ── VALIDATION ───────────────────────────────────────────
  clearErrors();

  let valid = true;
  let firstBad = null;

  if (!data.name || data.name.length < 2) {
    showError('enq-name', 'Please enter your name.');
    firstBad = firstBad || fields.name;
    valid = false;
  }
  if (!data.phone || !/^\d{10}$/.test(data.phone)) {
    showError('enq-phone', 'Enter a valid 10-digit mobile number.');
    firstBad = firstBad || fields.phone;
    valid = false;
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showError('enq-email', 'Enter a valid email address.');
    firstBad = firstBad || fields.email;
    valid = false;
  }
  if (!data.product) {
    showError('enq-product', 'Please select a product.');
    firstBad = firstBad || fields.product;
    valid = false;
  }

  if (!valid) {
    if (firstBad) {
      firstBad.focus();
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // ── UI: LOADING STATE ────────────────────────────────────
  const btn = document.getElementById('enq-submit-btn');
  setButtonState(btn, 'loading');

  // ── SAVE TO GOOGLE SHEETS, THEN CONFIRM IN PLACE ────────
  saveToSheet(data)
    .then(() => {
      showFormSuccess();
      setButtonState(btn, 'success');
      resetForm();
    })
    .catch((err) => {
      // Network/deployment problem — tell the visitor honestly and give
      // them a way to reach us, instead of silently claiming success.
      console.warn('Enquiry could not be saved to the sheet.', err);
      showFormError();
      setButtonState(btn, 'normal');
    })
    .finally(() => {
      setTimeout(() => setButtonState(btn, 'normal'), 4000);
    });
}

// ── GOOGLE SHEETS API CALL ───────────────────────────────────
// ⚠ UNCHANGED — this is the Google Sheets integration
function saveToSheet(data) {
  if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.includes('YOUR_GOOGLE')) {
    // Not configured yet — resolve silently so WhatsApp still fires
    return Promise.resolve();
  }

  return fetch(SHEET_WEBAPP_URL, {
    method:  'POST',
    mode:    'no-cors',            // required for Google Apps Script cross-origin
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  // Note: with mode:'no-cors' the response is opaque — we can't read it,
  // but the data IS saved to the sheet when Apps Script is deployed correctly.
}

// ── SUCCESS UI ───────────────────────────────────────────────
function showFormSuccess() {
  hideFormError();
  const successEl = document.getElementById('form-success');
  if (!successEl) return;
  successEl.style.display = 'flex';
  successEl.style.alignItems = 'center';
  successEl.style.justifyContent = 'center';
  successEl.style.gap = '8px';
  successEl.setAttribute('role', 'status');
  successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  // Auto-hide after 10 seconds
  clearTimeout(showFormSuccess._t);
  showFormSuccess._t = setTimeout(() => { successEl.style.display = 'none'; }, 10000);
}

function showFormError() {
  const el = document.getElementById('form-error');
  if (!el) return;
  el.style.display = 'flex';
  el.setAttribute('role', 'alert');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  clearTimeout(showFormError._t);
  showFormError._t = setTimeout(() => { el.style.display = 'none'; }, 14000);
}

function hideFormError() {
  const el = document.getElementById('form-error');
  if (el) el.style.display = 'none';
}

function resetForm() {
  const form = document.getElementById('enquiryForm');
  if (form) form.reset();
  clearErrors();
  document.querySelectorAll('#enquiryForm .form-group')
    .forEach(g => g.classList.remove('is-valid', 'has-error'));
}

// ── BUTTON STATE ─────────────────────────────────────────────
function setButtonState(btn, state) {
  if (!btn) return;
  const states = {
    normal:  { text: '<i class="fas fa-paper-plane"></i> Send Enquiry',                    disabled: false, bg: '' },
    loading: { text: '<i class="fas fa-circle-notch spin"></i> Sending…',                  disabled: true,  bg: '#5a7aaa' },
    success: { text: '<i class="fas fa-circle-check"></i> Enquiry Sent!',                  disabled: true,  bg: '#1a7a40' },
  };
  const s = states[state] || states.normal;
  btn.innerHTML  = s.text;
  btn.disabled   = s.disabled;
  btn.style.background = s.bg;
}

// ── INLINE ERROR HELPERS ─────────────────────────────────────
function showError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const group = el.closest('.form-group') || el.parentNode;
  group.classList.add('has-error');
  group.classList.remove('is-valid');
  el.setAttribute('aria-invalid', 'true');

  // Remove old error if any
  const old = group.querySelector('.field-error');
  if (old) old.remove();

  const err = document.createElement('span');
  err.className = 'field-error';
  err.setAttribute('role', 'alert');
  err.style.cssText = 'color:#e03030;font-size:12px;margin-top:4px;display:block;';
  err.textContent = msg;
  group.appendChild(err);
}

function clearErrors() {
  document.querySelectorAll('#enquiryForm .field-error').forEach(el => el.remove());
  document.querySelectorAll('#enquiryForm input, #enquiryForm select, #enquiryForm textarea')
    .forEach(el => {
      el.style.borderColor = '';
      el.removeAttribute('aria-invalid');
      const g = el.closest('.form-group');
      if (g) g.classList.remove('has-error');
    });
}

// ── LIVE VALIDATION & INPUT POLISH ───────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  const phone = document.getElementById('enq-phone');
  const name  = document.getElementById('enq-name');
  const email = document.getElementById('enq-email');
  const prod  = document.getElementById('enq-product');

  function mark(el, ok) {
    const g = el.closest('.form-group');
    if (!g) return;
    const empty = !el.value.trim();
    g.classList.toggle('is-valid', ok && !empty);
    if (ok) {
      g.classList.remove('has-error');
      const e = g.querySelector('.field-error');
      if (e) e.remove();
      el.removeAttribute('aria-invalid');
    }
  }

  // Digits only in the phone field (paste included)
  if (phone) {
    phone.addEventListener('input', function () {
      const cleaned = this.value.replace(/\D/g, '').slice(0, 10);
      if (cleaned !== this.value) this.value = cleaned;
      mark(this, /^\d{10}$/.test(this.value));
    });
    phone.addEventListener('blur', function () {
      if (this.value && !/^\d{10}$/.test(this.value)) {
        showError('enq-phone', 'Enter a valid 10-digit mobile number.');
      }
    });
  }

  if (name) {
    name.addEventListener('input', function () { mark(this, this.value.trim().length >= 2); });
  }

  if (email) {
    email.addEventListener('input', function () {
      mark(this, !this.value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value));
    });
    email.addEventListener('blur', function () {
      if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
        showError('enq-email', 'Enter a valid email address.');
      }
    });
  }

  if (prod) {
    prod.addEventListener('change', function () { mark(this, !!this.value); });
  }

  // Deep link: /index.html#order?product=... pre-selects a product
  const q = new URLSearchParams(window.location.search).get('product');
  if (q && prod) {
    Array.from(prod.options).forEach(function (o) {
      if (o.text.toLowerCase().indexOf(q.toLowerCase()) > -1) prod.value = o.value;
    });
  }
});
