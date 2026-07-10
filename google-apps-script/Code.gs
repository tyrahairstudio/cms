var BOOKING_HEADERS = [
  "Created At",
  "Booking ID",
  "Status",
  "Appointment Date",
  "Start Time",
  "End Time",
  "Duration (min)",
  "Customer Name",
  "Phone",
  "Email",
  "Services",
  "Staff",
  "Notes",
  "Source",
  "Request ID"
];

var ACTIVE_STATUSES = ["Pending", "Confirmed", "Completed"];

/**
 * Run once from the Apps Script editor. It creates/repairs the booking sheet,
 * stores private configuration in Script Properties, and prints a generated
 * webhook secret to the execution log. Copy that secret to Cloudflare Pages as
 * BOOKING_WEBHOOK_SECRET. Never paste it into public JavaScript or Git.
 */
function setupBookingSystem() {
  var properties = PropertiesService.getScriptProperties();
  properties.setProperties({
    SPREADSHEET_ID: "1wgYYOZNoN4BDtTlIUYwgVy4Ipn_o7QTYy0qBzc1lMj4",
    SHEET_NAME: "booking",
    NOTIFICATION_EMAIL: "tyrahairstudio.com@gmail.com",
    TIME_ZONE: "America/Chicago"
  }, false);

  var secret = properties.getProperty("BOOKING_WEBHOOK_SECRET");
  if (!secret) {
    secret = generateSecret_();
    properties.setProperty("BOOKING_WEBHOOK_SECRET", secret);
  }

  var spreadsheet = SpreadsheetApp.openById(properties.getProperty("SPREADSHEET_ID"));
  spreadsheet.setSpreadsheetTimeZone(properties.getProperty("TIME_ZONE"));
  var sheet = getOrCreateBookingSheet_();
  ensureHeaders_(sheet);
  formatBookingSheet_(sheet);

  console.log("BOOKING_WEBHOOK_SECRET=" + secret);
  console.log("Setup complete. Store the secret in Cloudflare Pages, then deploy this script as a Web app.");
  return { ok: true, sheet: sheet.getName(), secret: secret };
}

/** Generate and store a new secret. Update Cloudflare immediately after running. */
function rotateBookingSecret() {
  var secret = generateSecret_();
  PropertiesService.getScriptProperties().setProperty("BOOKING_WEBHOOK_SECRET", secret);
  console.log("NEW_BOOKING_WEBHOOK_SECRET=" + secret);
  return secret;
}

function doGet(e) {
  try {
    var parameters = e && e.parameter ? e.parameter : {};
    if (parameters.action !== "availability") {
      return json_({ ok: false, code: "INVALID_ACTION", message: "Unsupported action." });
    }

    var date = cleanText_(parameters.date, 10);
    var duration = Number(parameters.duration);
    var timestamp = cleanText_(parameters.timestamp, 20);
    var signature = cleanText_(parameters.signature, 128);
    var canonical = "availability|" + date + "|" + duration + "|" + timestamp;

    if (!isFreshTimestamp_(timestamp) || !verifySignature_(canonical, signature)) {
      return json_({ ok: false, code: "INVALID_SIGNATURE", message: "Request authentication failed." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isFinite(duration) || duration < 10 || duration > 720) {
      return json_({ ok: false, code: "INVALID_REQUEST", message: "Invalid availability request." });
    }

    var sheet = getOrCreateBookingSheet_();
    ensureHeaders_(sheet);
    return json_({ ok: true, date: date, busyIntervals: getBusyIntervals_(sheet, date) });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, code: "SERVER_ERROR", message: "Availability could not be loaded." });
  }
}

function doPost(e) {
  try {
    var envelope = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : "{}");
    var timestamp = cleanText_(envelope.timestamp, 20);
    var signature = cleanText_(envelope.signature, 128);
    var payloadText = typeof envelope.payload === "string" ? envelope.payload : "";

    if (!payloadText || !isFreshTimestamp_(timestamp) || !verifySignature_(timestamp + "." + payloadText, signature)) {
      return json_({ ok: false, code: "INVALID_SIGNATURE", message: "Request authentication failed." });
    }

    var payload = JSON.parse(payloadText);
    var validation = validateBooking_(payload);
    if (!validation.ok) return json_(validation);

    var rateKey = "phone_" + shortHash_(payload.customer.phone);
    var cache = CacheService.getScriptCache();
    if (cache.get(rateKey)) {
      return json_({ ok: false, code: "RATE_LIMITED", message: "Please wait a moment before sending another request." });
    }

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(8000)) {
      return json_({ ok: false, code: "BUSY", message: "The booking system is busy. Please try again." });
    }

    var bookingId;
    try {
      var sheet = getOrCreateBookingSheet_();
      ensureHeaders_(sheet);

      var duplicateId = findBookingByRequestId_(sheet, payload.requestId);
      if (duplicateId) return json_({ ok: true, bookingId: duplicateId, duplicate: true });

      if (hasConflict_(sheet, payload.appointment.date, payload.appointment.startTime, payload.appointment.duration)) {
        return json_({ ok: false, code: "SLOT_UNAVAILABLE", message: "That time was just taken. Please choose another time." });
      }

      bookingId = createBookingId_();
      var endTime = addMinutesToTime_(payload.appointment.startTime, payload.appointment.duration);
      sheet.appendRow([
        new Date(),
        bookingId,
        "Pending",
        payload.appointment.date,
        payload.appointment.startTime,
        endTime,
        payload.appointment.duration,
        safeSheetText_(payload.customer.name),
        safeSheetText_(payload.customer.phone),
        safeSheetText_(payload.customer.email),
        safeSheetText_(formatServices_(payload.services)),
        safeSheetText_(payload.appointment.staff || "Any available staff"),
        safeSheetText_(payload.notes || ""),
        safeSheetText_(payload.source || "tyrahairstudio.com/booking"),
        safeSheetText_(payload.requestId)
      ]);
      SpreadsheetApp.flush();
      cache.put(rateKey, "1", 60);
    } finally {
      lock.releaseLock();
    }

    sendNotifications_(bookingId, payload);
    return json_({ ok: true, bookingId: bookingId, status: "Pending" });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, code: "SERVER_ERROR", message: "The booking request could not be saved." });
  }
}

function validateBooking_(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, code: "INVALID_REQUEST", message: "Invalid booking request." };
  if (!payload.customer || !payload.appointment || !Array.isArray(payload.services) || !payload.services.length) {
    return { ok: false, code: "INVALID_REQUEST", message: "Booking details are incomplete." };
  }

  var name = cleanText_(payload.customer.name, 80);
  var phone = cleanText_(payload.customer.phone, 24);
  var email = cleanText_(payload.customer.email, 120);
  var appointment = payload.appointment;
  var duration = Number(appointment.duration);

  if (name.length < 2 || !/^[+()\d\s.\-]{7,24}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, code: "INVALID_CUSTOMER", message: "Customer contact details are invalid." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment.date || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(appointment.startTime || "")) {
    return { ok: false, code: "INVALID_TIME", message: "Appointment date or time is invalid." };
  }

  if (!isFinite(duration) || duration < 10 || duration > 720) {
    return { ok: false, code: "INVALID_DURATION", message: "Appointment duration is invalid." };
  }

  if (!isValidBusinessSlot_(appointment.date, appointment.startTime, duration)) {
    return { ok: false, code: "INVALID_TIME", message: "The selected time is outside the booking window." };
  }

  if (!/^[a-zA-Z0-9-]{12,100}$/.test(payload.requestId || "")) {
    return { ok: false, code: "INVALID_REQUEST_ID", message: "Request identifier is invalid." };
  }

  return { ok: true };
}

function getOrCreateBookingSheet_() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty("SPREADSHEET_ID") || "1wgYYOZNoN4BDtTlIUYwgVy4Ipn_o7QTYy0qBzc1lMj4";
  var sheetName = properties.getProperty("SHEET_NAME") || "booking";
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeaders_(sheet) {
  var current = sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).getDisplayValues()[0];
  var matches = BOOKING_HEADERS.every(function(header, index) { return current[index] === header; });
  if (!matches) sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);
}

function formatBookingSheet_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, BOOKING_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#eaeaea")
    .setFontColor("#1f1f1f")
    .setWrap(true);
  if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), BOOKING_HEADERS.length).createFilter();
  sheet.autoResizeColumns(1, BOOKING_HEADERS.length);
}

function getBusyIntervals_(sheet, date) {
  if (sheet.getLastRow() < 2) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, BOOKING_HEADERS.length).getDisplayValues();
  return rows.filter(function(row) {
    return row[3] === date && ACTIVE_STATUSES.indexOf(row[2]) !== -1;
  }).map(function(row) {
    var start = normalizeTime_(row[4]);
    var duration = Number(row[6]) || 0;
    return { start: start, end: normalizeTime_(row[5]) || addMinutesToTime_(start, duration) };
  }).filter(function(interval) { return interval.start && interval.end; });
}

function hasConflict_(sheet, date, startTime, duration) {
  var requestedStart = timeToMinutes_(startTime);
  var requestedEnd = requestedStart + Number(duration);
  return getBusyIntervals_(sheet, date).some(function(interval) {
    var busyStart = timeToMinutes_(interval.start);
    var busyEnd = timeToMinutes_(interval.end);
    return requestedStart < busyEnd && requestedEnd > busyStart;
  });
}

function findBookingByRequestId_(sheet, requestId) {
  if (sheet.getLastRow() < 2) return "";
  var values = sheet.getRange(2, 2, sheet.getLastRow() - 1, 14).getDisplayValues();
  for (var index = 0; index < values.length; index += 1) {
    if (values[index][13] === requestId) return values[index][0];
  }
  return "";
}

function sendNotifications_(bookingId, payload) {
  var properties = PropertiesService.getScriptProperties();
  var ownerEmail = properties.getProperty("NOTIFICATION_EMAIL") || "tyrahairstudio.com@gmail.com";
  var dateLabel = formatDateLabel_(payload.appointment.date);
  var timeLabel = formatTimeLabel_(payload.appointment.startTime);
  var servicesText = formatServices_(payload.services);
  var ownerSubject = "New booking request " + bookingId + " · " + dateLabel + " " + timeLabel;
  var customerSubject = "Tyra Hair Studio received your request · " + bookingId;
  var ownerHtml = buildOwnerEmail_(bookingId, payload, dateLabel, timeLabel, servicesText);
  var customerHtml = buildCustomerEmail_(bookingId, payload, dateLabel, timeLabel, servicesText);

  try {
    MailApp.sendEmail({
      to: ownerEmail,
      replyTo: payload.customer.email,
      subject: ownerSubject,
      htmlBody: ownerHtml,
      body: "New booking request " + bookingId + "\n" + dateLabel + " at " + timeLabel + "\n" + payload.customer.name + "\n" + payload.customer.phone + "\n" + servicesText,
      name: "Tyra Hair Studio Booking"
    });
  } catch (error) {
    console.error("Owner email failed: " + error);
  }

  try {
    MailApp.sendEmail({
      to: payload.customer.email,
      subject: customerSubject,
      htmlBody: customerHtml,
      body: "We received your appointment request " + bookingId + " for " + dateLabel + " at " + timeLabel + ". Tyra Hair Studio will confirm the appointment shortly.",
      name: "Tyra Hair Studio"
    });
  } catch (error) {
    console.error("Customer email failed: " + error);
  }
}

function buildOwnerEmail_(bookingId, payload, dateLabel, timeLabel, servicesText) {
  return '<div style="font-family:Arial,sans-serif;max-width:620px;color:#211819">' +
    '<h2 style="color:#613847">New appointment request</h2>' +
    '<p><strong>Request:</strong> ' + html_(bookingId) + '</p>' +
    '<p><strong>Date & time:</strong> ' + html_(dateLabel) + ' at ' + html_(timeLabel) + '</p>' +
    '<p><strong>Customer:</strong> ' + html_(payload.customer.name) + '<br>' + html_(payload.customer.phone) + '<br>' + html_(payload.customer.email) + '</p>' +
    '<p><strong>Services:</strong><br>' + html_(servicesText) + '</p>' +
    '<p><strong>Stylist:</strong> ' + html_(payload.appointment.staff || "Any available staff") + '</p>' +
    '<p><strong>Notes:</strong><br>' + html_(payload.notes || "None") + '</p>' +
    '<p style="color:#766b68;font-size:12px">Status is Pending. Update the booking row in Google Sheets after confirming with the customer.</p>' +
    '</div>';
}

function buildCustomerEmail_(bookingId, payload, dateLabel, timeLabel, servicesText) {
  return '<div style="font-family:Arial,sans-serif;max-width:620px;color:#211819">' +
    '<h1 style="font-family:Georgia,serif;color:#613847">We received your request.</h1>' +
    '<p>Hi ' + html_(payload.customer.name) + ',</p>' +
    '<p>Thank you for choosing Tyra Hair Studio. We received your appointment request and will confirm the time with you shortly.</p>' +
    '<div style="background:#f4ece9;padding:20px;border-left:3px solid #e18870">' +
    '<p><strong>Request:</strong> ' + html_(bookingId) + '</p>' +
    '<p><strong>Date:</strong> ' + html_(dateLabel) + '</p>' +
    '<p><strong>Time:</strong> ' + html_(timeLabel) + '</p>' +
    '<p><strong>Services:</strong><br>' + html_(servicesText) + '</p>' +
    '</div>' +
    '<p style="font-size:12px;color:#766b68">This is a request receipt, not the final appointment confirmation. Questions? Call (346) 666-7580.</p>' +
    '</div>';
}

function formatServices_(services) {
  return services.map(function(service) {
    var duration = Number(service.duration) ? service.duration + " min" : "consultation";
    return service.name + " (" + duration + ", " + (service.priceLabel || "price after consultation") + ")";
  }).join(" | ");
}

function createBookingId_() {
  var zone = PropertiesService.getScriptProperties().getProperty("TIME_ZONE") || "America/Chicago";
  var date = Utilities.formatDate(new Date(), zone, "yyyyMMdd");
  var suffix = Utilities.getUuid().replace(/-/g, "").slice(0, 6).toUpperCase();
  return "TYRA-" + date + "-" + suffix;
}

function generateSecret_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
}

function verifySignature_(message, signature) {
  var secret = PropertiesService.getScriptProperties().getProperty("BOOKING_WEBHOOK_SECRET");
  if (!secret || !signature) return false;
  return safeEquals_(hmacHex_(secret, message), signature.toLowerCase());
}

function hmacHex_(secret, message) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret, Utilities.Charset.UTF_8);
  return bytes.map(function(byte) {
    var value = byte < 0 ? byte + 256 : byte;
    return value.toString(16).padStart(2, "0");
  }).join("");
}

function safeEquals_(left, right) {
  if (left.length !== right.length) return false;
  var mismatch = 0;
  for (var index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function isFreshTimestamp_(value) {
  var timestamp = Number(value);
  return isFinite(timestamp) && Math.abs(Date.now() - timestamp) <= 5 * 60 * 1000;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function cleanText_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeSheetText_(value) {
  var text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function shortHash_(value) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(digest).slice(0, 20);
}

function normalizeTime_(value) {
  var match = String(value || "").match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return "";
  var hours = Number(match[1]);
  var minutes = Number(match[2]);
  var suffix = (match[3] || "").toUpperCase();
  if (suffix === "PM" && hours < 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

function timeToMinutes_(value) {
  var normalized = normalizeTime_(value);
  var parts = normalized.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function addMinutesToTime_(value, amount) {
  var total = timeToMinutes_(value) + Number(amount);
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

function isValidBusinessSlot_(iso, startTime, duration) {
  var parts = String(iso).split("-").map(Number);
  var date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  if (isNaN(date.getTime())) return false;

  var today = new Date();
  var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var appointmentStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var daysAhead = Math.floor((appointmentStart.getTime() - todayStart.getTime()) / 86400000);
  if (daysAhead < 0 || daysAhead > 90) return false;

  var day = date.getDay();
  var open = day === 0 ? 11 * 60 : day === 6 ? 9 * 60 : 9 * 60 + 30;
  var close = day === 0 ? 17 * 60 : day === 6 ? 18 * 60 + 30 : 19 * 60;
  var start = timeToMinutes_(startTime);
  var end = start + Number(duration);
  if (start < open || end > close) return false;

  if (daysAhead === 0) {
    var currentMinutes = today.getHours() * 60 + today.getMinutes() + 30;
    if (start < currentMinutes) return false;
  }
  return true;
}

function formatDateLabel_(iso) {
  var parts = iso.split("-").map(Number);
  var zone = PropertiesService.getScriptProperties().getProperty("TIME_ZONE") || "America/Chicago";
  return Utilities.formatDate(new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0), zone, "EEEE, MMMM d, yyyy");
}

function formatTimeLabel_(value) {
  var minutes = timeToMinutes_(value);
  var hours = Math.floor(minutes / 60);
  var mins = minutes % 60;
  return (hours % 12 || 12) + ":" + String(mins).padStart(2, "0") + " " + (hours >= 12 ? "PM" : "AM");
}

function html_(value) {
  return String(value || "").replace(/[&<>"']/g, function(character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}
