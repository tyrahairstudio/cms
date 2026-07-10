const MAX_BODY_BYTES = 32_000;
const MAX_UPSTREAM_BYTES = 64_000;
const UPSTREAM_TIMEOUT_MS = 12_000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

function configured(env) {
  return Boolean(env.BOOKING_APPS_SCRIPT_URL && env.BOOKING_WEBHOOK_SECRET);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function validatePayload(input) {
  if (!input || typeof input !== "object") return { error: "Invalid booking request." };

  const customer = input.customer || {};
  const appointment = input.appointment || {};
  const services = Array.isArray(input.services) ? input.services.slice(0, 12) : [];
  const name = cleanText(customer.name, 80);
  const phone = cleanText(customer.phone, 24);
  const email = cleanText(customer.email, 120).toLowerCase();
  const date = cleanText(appointment.date, 10);
  const startTime = cleanText(appointment.startTime, 5);
  const endTime = cleanText(appointment.endTime, 5);
  const duration = Number(appointment.duration);

  if (!name || name.length < 2) return { error: "Please enter a valid full name." };
  if (!/^[+()\d\s.-]{7,24}$/.test(phone)) return { error: "Please enter a valid mobile number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (!isValidDate(date) || !isValidTime(startTime) || !isValidTime(endTime)) return { error: "Please select a valid appointment date and time." };
  if (!Number.isFinite(duration) || duration < 10 || duration > 720) return { error: "The selected service duration is invalid." };
  if (!services.length) return { error: "Please select at least one service." };

  const requestId = cleanText(input.requestId, 100);
  if (!/^[a-zA-Z0-9-]{12,100}$/.test(requestId)) return { error: "Invalid request identifier." };

  const sanitizedServices = services.map((service) => ({
    id: cleanText(service.id, 80),
    name: cleanText(service.name, 120),
    category: cleanText(service.category, 80),
    duration: Number(service.duration) || 0,
    price: service.price === null || service.price === "" || service.price === undefined
      ? null
      : (Number.isFinite(Number(service.price)) ? Number(service.price) : null),
    priceLabel: cleanText(service.priceLabel, 30)
  })).filter((service) => service.id && service.name);

  if (!sanitizedServices.length) return { error: "Please select at least one valid service." };

  return {
    value: {
      requestId,
      createdAt: cleanText(input.createdAt, 40),
      clientStartedAt: cleanText(input.clientStartedAt, 40),
      customer: { name, phone, email },
      appointment: {
        date,
        startTime,
        endTime,
        duration,
        staff: cleanText(appointment.staff || "Any available staff", 80)
      },
      services: sanitizedServices,
      notes: cleanText(input.notes, 600),
      company: cleanText(input.company, 120),
      source: "tyrahairstudio.com/booking1",
      locale: cleanText(input.locale, 20)
    }
  };
}

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readScriptResponse(response) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_UPSTREAM_BYTES) throw new Error("Apps Script response is too large.");
  const text = await response.text();
  if (text.length > MAX_UPSTREAM_BYTES) throw new Error("Apps Script response is too large.");
  try {
    const result = JSON.parse(text);
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("Invalid response shape.");
    return result;
  } catch {
    throw new Error("Google Apps Script returned an invalid response.");
  }
}

function logUpstreamError(stage, error) {
  console.error(JSON.stringify({
    message: "booking upstream request failed",
    stage,
    error: error instanceof Error ? error.message : String(error)
  }));
}

function statusForScriptResult(result) {
  if (result.ok) return 200;
  if (result.code === "SLOT_UNAVAILABLE") return 409;
  if (result.code === "RATE_LIMITED") return 429;
  if (result.code === "INVALID_SIGNATURE") return 502;
  return 400;
}

export async function onRequestGet({ request, env }) {
  if (!configured(env)) {
    return jsonResponse({ ok: false, code: "NOT_CONFIGURED", message: "Booking integration is not configured yet." }, 503);
  }

  const requestUrl = new URL(request.url);
  const action = requestUrl.searchParams.get("action");
  const date = requestUrl.searchParams.get("date") || "";
  const duration = Number(requestUrl.searchParams.get("duration"));

  if (action !== "availability" || !isValidDate(date) || !Number.isFinite(duration) || duration < 10 || duration > 720) {
    return jsonResponse({ ok: false, message: "Invalid availability request." }, 400);
  }

  const timestamp = String(Date.now());
  const canonical = `availability|${date}|${duration}|${timestamp}`;
  const signature = await hmacHex(env.BOOKING_WEBHOOK_SECRET, canonical);
  try {
    const scriptUrl = new URL(env.BOOKING_APPS_SCRIPT_URL);
    scriptUrl.searchParams.set("action", "availability");
    scriptUrl.searchParams.set("date", date);
    scriptUrl.searchParams.set("duration", String(duration));
    scriptUrl.searchParams.set("timestamp", timestamp);
    scriptUrl.searchParams.set("signature", signature);
    const response = await fetch(scriptUrl.toString(), {
      headers: { accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    const result = await readScriptResponse(response);
    return jsonResponse(result, statusForScriptResult(result));
  } catch (error) {
    logUpstreamError("availability", error);
    return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", message: "Live availability is temporarily unavailable." }, 502);
  }
}

export async function onRequestPost({ request, env }) {
  if (!configured(env)) {
    return jsonResponse({ ok: false, code: "NOT_CONFIGURED", message: "Booking integration is not configured yet." }, 503);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonResponse({ ok: false, message: "Booking request is too large." }, 413);

  let input;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return jsonResponse({ ok: false, message: "Booking request is too large." }, 413);
    input = JSON.parse(raw);
  } catch {
    return jsonResponse({ ok: false, message: "Invalid booking request." }, 400);
  }

  const validated = validatePayload(input);
  if (validated.error) return jsonResponse({ ok: false, message: validated.error }, 400);
  const payload = validated.value;

  if (payload.company) {
    return jsonResponse({ ok: true, bookingId: `TYRA-${Date.now().toString().slice(-8)}` });
  }

  const clientStart = Date.parse(payload.clientStartedAt);
  if (Number.isFinite(clientStart) && Date.now() - clientStart < 2_500) {
    return jsonResponse({ ok: false, code: "TOO_FAST", message: "Please review your appointment before sending." }, 400);
  }

  const timestamp = String(Date.now());
  const payloadText = JSON.stringify(payload);
  const signature = await hmacHex(env.BOOKING_WEBHOOK_SECRET, `${timestamp}.${payloadText}`);

  try {
    const response = await fetch(env.BOOKING_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", accept: "application/json" },
      body: JSON.stringify({ timestamp, signature, payload: payloadText }),
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    const result = await readScriptResponse(response);
    return jsonResponse(result, statusForScriptResult(result));
  } catch (error) {
    logUpstreamError("booking", error);
    return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", message: "We could not save your request. Please try again or call the salon." }, 502);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "GET, POST, OPTIONS",
      "cache-control": "no-store"
    }
  });
}
