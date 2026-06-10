// ============================================================
// PAPA N TOOTS — Lead Capture Google Apps Script
// ============================================================
// Receives form submissions from papantoots.com and writes them to a
// Google Sheet. Emails the owner + sends a friendly auto-reply to the
// customer.
//
// Forms supported:
//   1. catering_inquiry — the 4-step "Build Your Catering Order" form
//   2. preorder         — the specialty-items waitlist (sausage / laulau)
//
// SETUP: see SETUP-GOOGLE-SHEETS.md (about 10 minutes).
// ============================================================

// -------- CONFIGURATION --------
// Owner notification(s) — comma-separated for multiple recipients.
const NOTIFICATION_EMAIL = 'papantoots@gmail.com';
const SHEET_NAME = 'Leads';

// Your Google Sheet's ID — the long string in the sheet's URL between /d/ and /edit:
//   https://docs.google.com/spreadsheets/d/THIS_LONG_ID/edit
// Paste it below so this works even as a standalone script.
const SHEET_ID = '1WyyhFY_uZads5v70IHrt9SUSsKyqn1DljcuEZi6u8cA';

// Customer auto-reply (set to false to disable).
const SEND_CUSTOMER_AUTOREPLY = true;
const AUTOREPLY_SIGNATURE = 'Mahalo,\nPapa N Toots\nKeaʻau, Hawaiʻi Island\npapantoots@gmail.com\ninstagram.com/papa_n_toots';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = (SHEET_ID && SHEET_ID !== 'PASTE_YOUR_SHEET_ID_HERE')
      ? SpreadsheetApp.openById(SHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create the sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp',
        'Form Type',
        'Status',
        'Name',
        'Email / Contact',
        'Phone',
        'Event Date',
        'Event Type',
        'Guests',
        'Menu',
        'Selections / Items',
        'Location',
        'Preferred Contact',
        'Notes'
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#2e2014').setFontColor('#f0ece6');
      sheet.setFrozenRows(1);
      const widths = [160, 140, 110, 150, 230, 130, 110, 150, 80, 150, 320, 180, 130, 280];
      widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

      // Status dropdown
      const statusRange = sheet.getRange(2, 3, sheet.getMaxRows() - 1, 1);
      statusRange.setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(['New', 'Contacted', 'Quoted', 'Confirmed', 'Done', 'Lost'], true)
          .setAllowInvalid(false)
          .build()
      );

      // Status color coding
      const rules = sheet.getConditionalFormatRules();
      [
        { val: 'New',       bg: '#fff3cd', fg: '#7a5e00' },
        { val: 'Contacted', bg: '#d6e9ff', fg: '#1e3a8a' },
        { val: 'Quoted',    bg: '#ffe2c2', fg: '#7c3a00' },
        { val: 'Confirmed', bg: '#c8e8c8', fg: '#1c5e1c' },
        { val: 'Done',      bg: '#e3e3e3', fg: '#444444' },
        { val: 'Lost',      bg: '#f7c8c8', fg: '#7a1c1c' }
      ].forEach(c => {
        rules.push(SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo(c.val).setBackground(c.bg).setFontColor(c.fg)
          .setRanges([statusRange]).build());
      });
      sheet.setConditionalFormatRules(rules);
    }

    const isSausage = data.formType === 'sausage_preorder';
    const isPreorder = data.formType === 'preorder';
    const formTypeDisplay = isSausage ? '🌭 Sausage Pre-Order'
      : isPreorder ? '🍢 Laulau Waitlist'
      : '🍽️ Catering Inquiry';

    // Selections / Items column — sausage gets a "N bags ($total)" summary
    let itemsCol = data.selections || data.items || '';
    if (isSausage) {
      itemsCol = data.bags
        ? (data.bags + ' × 3 lb bag' + (data.bags > 1 ? 's' : '') + (data.estimatedTotal ? ' (' + data.estimatedTotal + ')' : ''))
        : 'Notify list';
    }

    // Write the row (one schema for all form types)
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }),
      formTypeDisplay,
      'New',
      data.name || '',
      data.email || data.contact || '',
      data.phone || '',
      data.eventDate || data.batch || '',
      data.eventType || '',
      data.guests || '',
      data.menu || '',
      itemsCol,
      data.location || '',
      data.contactMethod || '',
      data.notes || ''
    ]);

    // Row tint by type
    const lastRow = sheet.getLastRow();
    const tint = isSausage ? '#FFE9CC' : isPreorder ? '#F0F7FF' : '#FFF6E8';
    sheet.getRange(lastRow, 1, 1, 2).setBackground(tint);
    sheet.getRange(lastRow, 4, 1, 11).setBackground(tint);

    sendOwnerNotification(data);
    const customerEmail = data.email || (isValidEmail(data.contact) ? data.contact : '');
    if (SEND_CUSTOMER_AUTOREPLY && customerEmail) {
      sendCustomerAutoreply(data, customerEmail);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());
}

// -------- OWNER NOTIFICATION --------
function sendOwnerNotification(data) {
  const isSausage = data.formType === 'sausage_preorder';
  const isPreorder = data.formType === 'preorder';
  const name = data.name || 'Someone';
  const subject = isSausage
    ? '🌭 New Sausage Pre-Order — ' + name
    : isPreorder
      ? '🍢 New Laulau Waitlist — ' + name
      : '🍽️ New Catering Inquiry — ' + name;

  let body = (isSausage ? 'PASTELLE SAUSAGE PRE-ORDER' : isPreorder ? 'LAULAU WAITLIST' : 'CATERING INQUIRY') + ' — New Lead!\n';
  body += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  body += 'Name:  ' + name + '\n';

  if (isSausage) {
    body += 'Contact: ' + (data.contact || '-') + '\n\n';
    body += 'THE RESERVATION\n─────────────\n';
    body += 'Batch:  ' + (data.batch || '-') + '\n';
    if (data.bags) body += 'Bags (3 lb): ' + data.bags + '\n';
    if (data.estimatedTotal) body += 'Est. total:  ' + data.estimatedTotal + ' (pay at pickup)\n';
    if (data.notes) body += '\nPickup notes:\n' + data.notes + '\n';
  } else if (isPreorder) {
    body += 'Contact: ' + (data.contact || '-') + '\n\n';
    body += 'WHAT THEY WANT\n─────────────\n';
    body += (data.items || '-').split('  |  ').join('\n') + '\n';
  } else {
    body += 'Email: ' + (data.email || '-') + '\n';
    body += 'Phone: ' + (data.phone || '-') + '\n';
    body += 'Preferred Contact: ' + (data.contactMethod || '-') + '\n\n';
    body += 'EVENT DETAILS\n─────────────\n';
    body += 'Date:     ' + (data.eventDate || '-') + '\n';
    body += 'Type:     ' + (data.eventType || '-') + '\n';
    body += 'Guests:   ' + (data.guests || '-') + '\n';
    body += 'Location: ' + (data.location || '-') + '\n\n';
    body += 'MENU & SELECTIONS\n─────────────\n';
    body += 'Menu: ' + (data.menu || '-') + '\n';
    body += (data.selections || '-').split('  |  ').join('\n') + '\n';
    if (data.notes) body += '\nNotes:\n' + data.notes + '\n';
  }

  body += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
  body += 'Hit Reply to reach them directly. All leads live in the Google Sheet.';

  const replyTo = data.email || (isValidEmail(data.contact) ? data.contact : NOTIFICATION_EMAIL);
  try {
    MailApp.sendEmail({ to: NOTIFICATION_EMAIL, subject: subject, body: body, replyTo: replyTo });
  } catch (err) {
    console.log('Owner email failed: ' + err);
  }
}

// -------- CUSTOMER AUTO-REPLY --------
function sendCustomerAutoreply(data, toEmail) {
  const isSausage = data.formType === 'sausage_preorder';
  const isPreorder = data.formType === 'preorder';
  const isNotify = isSausage && (!data.bags);
  const firstName = (data.name || '').split(' ')[0] || 'there';
  const subject = isSausage
    ? (isNotify ? "You're on the list — Papa N Toots Pastelle Sausage" : 'Your Pastelle Sausage reservation — Papa N Toots')
    : isPreorder
      ? "You're on the list — Papa N Toots"
      : 'Mahalo! Your Papa N Toots catering inquiry';

  let body = 'Aloha ' + firstName + ',\n\n';
  if (isSausage && !isNotify) {
    body += "Your Pastelle Sausage bags are reserved! Here's what we've got down:\n\n";
    body += 'Batch:        ' + (data.batch || '-') + '\n';
    body += 'Bags (3 lb):  ' + (data.bags || '-') + '\n';
    body += 'Est. total:   ' + (data.estimatedTotal || '-') + '\n\n';
    body += "No payment needed now — we'll text or email to confirm your batch and pickup. Bags are first come, first served, so we'll lock yours in.\n\n";
  } else if (isSausage && isNotify) {
    body += "You're on the list for our next Pastelle Sausage batch! It sells out in 24-72 hours, so we'll reach out the moment the next run is ready. No commitment until you confirm.\n\n";
  } else if (isPreorder) {
    body += "You're on the waitlist for our next batch! Here's what you asked for:\n\n";
    body += (data.items || '').split('  |  ').join('\n') + '\n\n';
    body += "These sell out fast, so we'll reach out as soon as the next run is ready for you to confirm. No commitment until then.\n\n";
  } else {
    body += "Mahalo for thinking of Papa N Toots for your event! We've got your inquiry and will get back to you within 24 hours with a quote.\n\n";
    body += "Here's a copy of what you put together:\n\n";
    body += 'Menu: ' + (data.menu || '-') + '\n';
    body += (data.selections || '').split('  |  ').join('\n') + '\n\n';
    if (data.eventDate) body += 'Event Date: ' + data.eventDate + '\n';
    if (data.guests) body += 'Guests: ' + data.guests + '\n';
    if (data.eventType) body += 'Event: ' + data.eventType + '\n';
    body += '\n';
  }
  body += AUTOREPLY_SIGNATURE;

  try {
    MailApp.sendEmail({ to: toEmail, subject: subject, body: body });
  } catch (err) {
    console.log('Customer auto-reply failed: ' + err);
  }
}

// -------- TEST FUNCTION --------
// Run this from the Apps Script editor to verify everything works.
function testSetup() {
  doPost({ postData: { contents: JSON.stringify({
    formType: 'catering_inquiry',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }),
    name: 'Test Person', email: 'test@example.com', phone: '(808) 555-0000',
    contactMethod: 'Text', menu: "People's Choice Menu",
    selections: 'Entrées: Korean Chicken, Kalua Pork, Laulau  |  Starch / Sides: Mac Salad, Pickled Onion (Original)',
    eventDate: '2026-08-15', eventType: 'Birthday / Graduation', guests: '60',
    location: 'Hilo', notes: 'Test submission — delete this row.'
  }) } });
  doPost({ postData: { contents: JSON.stringify({
    formType: 'preorder',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }),
    name: 'Test Waitlist', contact: '(808) 555-1212',
    items: 'Signature Laulau (Pastelle) 3 lbs  |  Signature Laulau (Kimchi) 3 lbs'
  }) } });
  doPost({ postData: { contents: JSON.stringify({
    formType: 'sausage_preorder',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }),
    name: 'Test Sausage', contact: 'sausage@example.com',
    batch: 'Sat, Jun 14 · Keaʻau pickup', bags: '2', estimatedTotal: '$40',
    notes: 'Afternoon pickup works best — test row, delete me.'
  }) } });
  Logger.log('✅ Three test rows added to the "Leads" tab. Check the sheet.');
}
