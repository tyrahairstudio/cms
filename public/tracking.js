const TRACKING_CONFIG = Object.freeze({
  metaPixelId: "1069696538855743",
  googleTagId: "AW-18392154806",
  googleBookingConversion: "AW-18392154806/Ec_2CL-oveIcELaFiMJE",
  bookingHost: "book.gocheckin.net",
  consentKey: "tyra_optional_tracking_consent_v1"
});

const CONSENT_ACCEPTED = "accepted";
const CONSENT_DECLINED = "declined";
let optionalTagsLoaded = false;
let consentPanel = null;

function readConsent() {
  try {
    const value = window.localStorage.getItem(TRACKING_CONFIG.consentKey);
    return value === CONSENT_ACCEPTED || value === CONSENT_DECLINED ? value : null;
  } catch {
    return null;
  }
}

function writeConsent(value) {
  try {
    window.localStorage.setItem(TRACKING_CONFIG.consentKey, value);
  } catch {
    // The choice remains effective for the current page when storage is unavailable.
  }
}

function ensureGoogleQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
}

function updateGoogleConsent(granted) {
  ensureGoogleQueue();
  window.gtag("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied"
  });
}

function loadGoogleTag() {
  if (document.querySelector(`[data-tyra-google-tag="${TRACKING_CONFIG.googleTagId}"]`)) return;

  ensureGoogleQueue();
  updateGoogleConsent(true);
  window.gtag("js", new Date());
  window.gtag("config", TRACKING_CONFIG.googleTagId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(TRACKING_CONFIG.googleTagId)}`;
  script.dataset.tyraGoogleTag = TRACKING_CONFIG.googleTagId;
  document.head.append(script);
}

function loadMetaPixel() {
  if (window.fbq?.loaded) return;

  ((facebook, browser, element, source, queue, script, firstScript) => {
    if (facebook.fbq) return;
    queue = facebook.fbq = function fbq() {
      queue.callMethod ? queue.callMethod.apply(queue, arguments) : queue.queue.push(arguments);
    };
    if (!facebook._fbq) facebook._fbq = queue;
    queue.push = queue;
    queue.loaded = true;
    queue.version = "2.0";
    queue.queue = [];
    script = browser.createElement(element);
    script.async = true;
    script.src = source;
    script.dataset.tyraMetaPixel = TRACKING_CONFIG.metaPixelId;
    firstScript = browser.getElementsByTagName(element)[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", TRACKING_CONFIG.metaPixelId);
  window.fbq("track", "PageView");
}

function loadOptionalTags() {
  if (optionalTagsLoaded) return;
  optionalTagsLoaded = true;
  loadGoogleTag();
  loadMetaPixel();
}

function safeHost(url) {
  try {
    return new URL(url, window.location.href).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function ctaLocation(link) {
  const section = link.closest("header, main, footer, section, nav, aside");
  if (section?.id) return section.id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (link.closest("header, nav")) return "navigation";
  if (link.closest("footer")) return "footer";
  if (link.classList.contains("float-pill")) return "floating_cta";
  return window.location.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9_-]/gi, "_").toLowerCase() || "home";
}

function eventParameters(link) {
  return {
    cta_location: ctaLocation(link),
    destination_host: safeHost(link.href)
  };
}

function trackBookingClick(link) {
  if (readConsent() !== CONSENT_ACCEPTED) return;
  const parameters = eventParameters(link);

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", "booking_click", parameters);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", "booking_click", parameters);
    window.gtag("event", "conversion", {
      send_to: TRACKING_CONFIG.googleBookingConversion,
      value: 0,
      currency: "USD",
      ...parameters
    });
  }
}

function trackContactClick(link, eventName, method) {
  if (readConsent() !== CONSENT_ACCEPTED) return;
  const parameters = { ...eventParameters(link), contact_method: method };

  if (typeof window.fbq === "function") {
    window.fbq("track", "Contact", parameters);
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, parameters);
  }
}

function handleTrackedClick(event) {
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link) return;

  const protocol = new URL(link.href, window.location.href).protocol;
  const destinationHost = safeHost(link.href);
  if (link.matches("[data-booking]") || destinationHost === TRACKING_CONFIG.bookingHost) {
    trackBookingClick(link);
  } else if (protocol === "tel:") {
    trackContactClick(link, "click_to_call", "phone");
  } else if (protocol === "mailto:") {
    trackContactClick(link, "email_click", "email");
  }
}

function injectConsentStyles() {
  if (document.querySelector("[data-tyra-consent-styles]")) return;
  const style = document.createElement("style");
  style.dataset.tyraConsentStyles = "true";
  style.textContent = `
    .tyra-consent {
      position: fixed;
      z-index: 10000;
      left: 50%;
      bottom: 12px;
      width: min(860px, calc(100vw - 32px));
      padding: 10px 12px;
      color: #f8f2ea;
      background: rgba(23, 18, 15, .94);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(211, 168, 95, .52);
      border-radius: 12px;
      box-shadow: 0 12px 34px rgba(0, 0, 0, .22);
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      transform: translateX(-50%);
      font: 12.5px/1.4 Arial, sans-serif;
    }
    .tyra-consent h2 { margin: 0 0 2px; color: #fff; font: 600 15px/1.2 Georgia, serif; }
    .tyra-consent p { margin: 0; color: #eee4da; }
    .tyra-consent a { color: #efc778; }
    .tyra-consent-actions { display: flex; flex-wrap: nowrap; gap: 8px; margin: 0; }
    .tyra-consent button {
      min-height: 36px;
      padding: 8px 12px;
      border: 1px solid #d3a85f;
      border-radius: 999px;
      font: 700 12.5px/1 Arial, sans-serif;
      cursor: pointer;
      white-space: nowrap;
    }
    .tyra-consent-accept { color: #17120f; background: #efc778; }
    .tyra-consent-decline { color: #f8f2ea; background: transparent; }
    .tyra-privacy-controls {
      margin-left: .75rem;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
      text-decoration: underline;
      cursor: pointer;
      font: inherit;
    }
    @media (max-width: 700px) {
      .tyra-consent {
        left: 8px;
        bottom: calc(76px + env(safe-area-inset-bottom));
        width: calc(100vw - 16px);
        padding: 7px 8px;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px;
        transform: none;
        font-size: 10.5px;
        line-height: 1.3;
      }
      .tyra-consent h2 { display: none; }
      .tyra-consent-actions { display: flex; gap: 5px; }
      .tyra-consent button { min-height: 34px; min-width: 0; padding: 7px 9px; font-size: 11px; }
    }
  `;
  document.head.append(style);
}

function closeConsentPanel() {
  consentPanel?.remove();
  consentPanel = null;
}

function showConsentPanel({ managing = false } = {}) {
  closeConsentPanel();
  injectConsentStyles();

  consentPanel = document.createElement("aside");
  consentPanel.className = "tyra-consent";
  consentPanel.setAttribute("role", "dialog");
  consentPanel.setAttribute("aria-labelledby", "tyra-consent-title");
  consentPanel.setAttribute("aria-describedby", "tyra-consent-description");
  consentPanel.innerHTML = `
    <div>
      <h2 id="tyra-consent-title">Privacy choices</h2>
      <p id="tyra-consent-description">Optional analytics and ad cookies help measure visits and booking-link clicks. No contact or booking details are sent. <a href="/privacy/">Details</a></p>
    </div>
    <div class="tyra-consent-actions">
      <button class="tyra-consent-accept" type="button" data-consent-accept>Allow</button>
      <button class="tyra-consent-decline" type="button" data-consent-decline>Decline</button>
    </div>
  `;

  consentPanel.querySelector("[data-consent-accept]").addEventListener("click", () => {
    writeConsent(CONSENT_ACCEPTED);
    loadOptionalTags();
    closeConsentPanel();
  });

  consentPanel.querySelector("[data-consent-decline]").addEventListener("click", () => {
    const wasAccepted = readConsent() === CONSENT_ACCEPTED;
    writeConsent(CONSENT_DECLINED);
    updateGoogleConsent(false);
    if (typeof window.fbq === "function") window.fbq("consent", "revoke");
    closeConsentPanel();
    if (managing && wasAccepted) window.location.reload();
  });

  document.body.append(consentPanel);
  consentPanel.querySelector("[data-consent-accept]").focus({ preventScroll: true });
}

function addPrivacyControls() {
  const target = document.querySelector(".footer-credit") || document.querySelector("footer") || document.body;
  if (document.querySelector("[data-manage-privacy]")) return;

  const wrapper = document.createElement("span");
  wrapper.innerHTML = `<a href="/privacy/">Privacy</a><button class="tyra-privacy-controls" type="button" data-manage-privacy>Privacy choices</button>`;
  target.append(wrapper);
  wrapper.querySelector("[data-manage-privacy]").addEventListener("click", () => showConsentPanel({ managing: true }));
}

function initializeTracking() {
  document.addEventListener("click", handleTrackedClick, { capture: true });
  injectConsentStyles();
  addPrivacyControls();

  if (readConsent() === CONSENT_ACCEPTED) {
    loadOptionalTags();
  } else if (readConsent() !== CONSENT_DECLINED) {
    showConsentPanel();
  }
}

window.tyraTracking = Object.freeze({
  showPrivacyChoices: () => showConsentPanel({ managing: true }),
  consentStatus: () => readConsent()
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTracking, { once: true });
} else {
  initializeTracking();
}
