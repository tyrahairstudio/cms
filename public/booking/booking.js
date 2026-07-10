const serviceCatalog = [
  {
    id: "hair-cuts",
    name: "Hair Cuts",
    services: [
      { id: "women-cut-only", name: "Women: Cut Only", duration: 35, price: 35, priceLabel: "$35+" },
      { id: "women-wash-cut-style", name: "Women: Wash Cut Blow Out", duration: 45, price: 45, priceLabel: "$45+" },
      { id: "men-cut", name: "Men", duration: 20, price: 20, priceLabel: "$20+" },
      { id: "boy-cut", name: "Boy", duration: 18, price: 18, priceLabel: "$18+" },
      { id: "girl-cut", name: "Girl", duration: 30, price: 30, priceLabel: "$30+" },
      { id: "beard-trim", name: "Beard Trim", duration: 10, price: 10, priceLabel: "$10+" },
      { id: "bang-trim", name: "Bang Trim", duration: 10, price: 10, priceLabel: "$10+" },
      { id: "hair-wash", name: "Hair Wash", duration: 10, price: 10, priceLabel: "$10" }
    ]
  },
  {
    id: "hair-color",
    name: "Hair Color",
    services: [
      { id: "mens-color", name: "Men's Color", duration: 65, price: 65, priceLabel: "$65+" },
      { id: "mens-highlights", name: "Men's Highlights", duration: 85, price: 85, priceLabel: "$85+" },
      { id: "all-over-color", name: "All Over Color", duration: 130, price: 130, priceLabel: "$130+" },
      { id: "partial-highlights", name: "Partial Highlights", duration: 120, price: 120, priceLabel: "$120+" },
      { id: "full-highlights", name: "Full Highlights", duration: 180, price: 180, priceLabel: "$180+" },
      { id: "balayage-ombre", name: "Balayage / Ombre", duration: 220, price: 220, priceLabel: "$220+" },
      { id: "gray-cover", name: "Gray Cover", duration: 75, price: 75, priceLabel: "$75+" },
      { id: "bleach-tone", name: "Bleach & Tone", duration: 200, price: 200, priceLabel: "$200+" },
      { id: "toner", name: "Toner", duration: 65, price: 65, priceLabel: "$65+" },
      { id: "color-correction", name: "Color Correction", duration: 0, price: null, priceLabel: "Consult" }
    ]
  },
  {
    id: "hair-style",
    name: "Hair Style",
    services: [
      { id: "styling", name: "Styling (Curls / Straight)", duration: 25, price: 25, priceLabel: "$25+" },
      { id: "special-updos", name: "Special Up-dos", duration: 45, price: 45, priceLabel: "$45+" },
      { id: "shampoo-style", name: "Shampoo And Style (Blowout)", duration: 35, price: 35, priceLabel: "$35+" }
    ]
  },
  {
    id: "perm",
    name: "Perm",
    services: [
      { id: "silky-cold-perm", name: "Silky Cold Perm", duration: 100, price: 100, priceLabel: "$100+" },
      { id: "mens-perm", name: "Men's Perm", duration: 85, price: 85, priceLabel: "$85+" },
      { id: "body-spiral-perm", name: "Body Waves / Spiral Perm", duration: 150, price: 150, priceLabel: "$150+" },
      { id: "japanese-straightening", name: "Japanese Straightening Perm", duration: 250, price: 250, priceLabel: "$250+" }
    ]
  },
  {
    id: "treatments",
    name: "Treatments",
    services: [
      { id: "shiny-glossing", name: "Shiny Glossing Treatment", duration: 35, price: 35, priceLabel: "$35+" },
      { id: "olaplex", name: "Olaplex Treatment", duration: 35, price: 35, priceLabel: "$35+" },
      { id: "keratin", name: "Keratin Treatment", duration: 180, price: 180, priceLabel: "$180+" },
      { id: "brazilian-blowout", name: "Brazilian Blowouts Treatment", duration: 220, price: 220, priceLabel: "$220+" }
    ]
  },
  {
    id: "waxing",
    name: "Waxing",
    services: [
      { id: "eyebrow", name: "Eyebrow", duration: 15, price: 15, priceLabel: "$15+" },
      { id: "lip", name: "Lip", duration: 10, price: 10, priceLabel: "$10+" },
      { id: "chin", name: "Chin", duration: 10, price: 10, priceLabel: "$10+" },
      { id: "full-face", name: "Full Face", duration: 30, price: 30, priceLabel: "$30+" }
    ]
  },
  {
    id: "head-spa",
    name: "Head Spa",
    services: [
      { id: "scalp-deep-conditioning-massage", name: "Scalp Treatment / Deep Conditioning / Head Massage", duration: 60, price: 60, priceLabel: "$60+" }
    ]
  }
];

const serviceMap = new Map();
serviceCatalog.forEach((category) => {
  category.services.forEach((service) => serviceMap.set(service.id, { ...service, category: category.name }));
});

const staffChoices = ["TYRA"];
const mobileBookingQuery = window.matchMedia("(max-width: 680px)");
const localPreviewHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const bookingApiUrl = localPreviewHosts.has(window.location.hostname)
  ? "https://tyrahairstudio.com/api/booking"
  : "/api/booking";
const storageKey = "tyra-booking-state";
const startedAt = Date.now();
const today = startOfDay(new Date());
const lastBookableDate = addDays(today, 90);
const savedState = readSavedState();
let pendingRequestId = "";
let pendingRequestFingerprint = "";

const state = {
  step: 1,
  activeCategory: serviceCatalog.some((category) => category.id === savedState.activeCategory)
    ? savedState.activeCategory
    : serviceCatalog[0].id,
  selectedIds: new Set((savedState.selectedIds || []).filter((id) => serviceMap.has(id))),
  selectedDate: isBookableIsoDate(savedState.selectedDate) ? savedState.selectedDate : "",
  selectedTime: savedState.selectedTime || "",
  staff: staffChoices.includes(savedState.staff) ? savedState.staff : "TYRA",
  mobileSelection: savedState.mobileSelection === "staff" ? "staff" : "services",
  currentMonth: firstOfMonth(savedState.selectedDate ? parseIsoDate(savedState.selectedDate) : today),
  busyIntervals: [],
  availabilityRequest: 0
};

document.body.dataset.bookingStep = String(state.step);

const elements = {
  categoryRibbon: document.querySelector("[data-category-ribbon]"),
  serviceGroups: document.querySelector("[data-service-groups]"),
  serviceSearch: document.querySelector("[data-service-search]"),
  mobileServicePanel: document.querySelector("[data-mobile-service-panel]"),
  mobileStaffPanel: document.querySelector("[data-mobile-staff-panel]"),
  emptyServices: document.querySelector("[data-empty-services]"),
  calendarTitle: document.querySelector("[data-calendar-title]"),
  calendarGrid: document.querySelector("[data-calendar-grid]"),
  calendarPrev: document.querySelector("[data-calendar-prev]"),
  calendarNext: document.querySelector("[data-calendar-next]"),
  selectedDateLabel: document.querySelector("[data-selected-date-label]"),
  durationPill: document.querySelector("[data-duration-pill]"),
  timeGroups: document.querySelector("[data-time-groups]"),
  availabilityMessage: document.querySelector("[data-availability-message]"),
  staff: document.querySelector("[data-staff]"),
  form: document.querySelector("[data-booking-form]"),
  formStatus: document.querySelector("[data-form-status]"),
  submitLabel: document.querySelector("[data-submit-label]"),
  confirmation: document.querySelector("[data-confirmation]"),
  confirmationTicket: document.querySelector("[data-confirmation-ticket]"),
  summaryCount: document.querySelector("[data-summary-count]"),
  summaryEmpty: document.querySelector("[data-summary-empty]"),
  summaryServices: document.querySelector("[data-summary-services]"),
  summaryDate: document.querySelector("[data-summary-date]"),
  summaryTime: document.querySelector("[data-summary-time]"),
  summaryStaff: document.querySelector("[data-summary-staff]"),
  summaryDuration: document.querySelector("[data-summary-duration]"),
  summarySheet: document.querySelector(".appointment-ribbon"),
  summaryBackdrop: document.querySelector(".mobile-sheet-backdrop"),
  mobileDock: document.querySelector("[data-mobile-booking-dock]"),
  mobileDockSummaryButton: document.querySelector("[data-summary-open]"),
  mobileDockLabel: document.querySelector("[data-mobile-dock-label]"),
  mobileDockSummary: document.querySelector("[data-mobile-dock-summary]"),
  mobilePrimary: document.querySelector("[data-mobile-primary]")
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function firstOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isBookableIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = startOfDay(parseIsoDate(value));
  return date >= today && date <= lastBookableDate;
}

function readSavedState() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function saveState() {
  sessionStorage.setItem(storageKey, JSON.stringify({
    selectedIds: [...state.selectedIds],
    activeCategory: state.activeCategory,
    selectedDate: state.selectedDate,
    selectedTime: state.selectedTime,
    staff: state.staff,
    mobileSelection: state.mobileSelection
  }));
}

function selectedServices() {
  return [...state.selectedIds].map((id) => serviceMap.get(id)).filter(Boolean);
}

function totalDuration() {
  return selectedServices().reduce((total, service) => total + service.duration, 0);
}

function schedulingDuration() {
  return totalDuration() || 30;
}

function serviceOptionMarkup(service, index) {
  const selected = state.selectedIds.has(service.id);
  const durationLabel = service.duration ? `${service.duration} minutes` : "Consultation required";
  return `
    <button class="service-option${selected ? " is-selected" : ""}" type="button" data-service-id="${service.id}" aria-pressed="${selected}">
      <span class="service-number" aria-hidden="true">${index + 1}</span>
      <span class="service-copy">
        <strong>${escapeHtml(service.name)}</strong>
        <small>${durationLabel}</small>
      </span>
      <span class="service-check" aria-hidden="true">✓</span>
    </button>
  `;
}

function renderDesktopServices(normalized) {
  const category = serviceCatalog.find((item) => item.id === state.activeCategory) || serviceCatalog[0];
  const visibleServices = category.services.filter((service) =>
    !normalized || service.name.toLowerCase().includes(normalized)
  );

  elements.categoryRibbon.hidden = false;
  elements.categoryRibbon.innerHTML = serviceCatalog.map((item) => `
    <button
      class="category-button${item.id === category.id ? " is-active" : ""}"
      type="button"
      role="tab"
      aria-selected="${item.id === category.id}"
      aria-controls="category-${item.id}"
      data-category-target="${item.id}"
    >
      ${escapeHtml(item.name)}
    </button>
  `).join("");

  elements.serviceGroups.innerHTML = `
    <section class="service-group" id="category-${category.id}" role="tabpanel" data-category-group="${category.id}">
      <div class="service-group-head">
        <h3>${escapeHtml(category.name)}</h3>
        <span>${visibleServices.length} ${visibleServices.length === 1 ? "service" : "services"}</span>
      </div>
      <div class="service-list">
        ${visibleServices.map(serviceOptionMarkup).join("")}
      </div>
    </section>
  `;

  elements.emptyServices.hidden = visibleServices.length > 0;
}

function renderMobileServices(normalized) {
  let matchCount = 0;
  elements.categoryRibbon.hidden = true;
  elements.categoryRibbon.innerHTML = "";
  elements.serviceGroups.innerHTML = serviceCatalog.map((category) => {
    const visibleServices = category.services.filter((service) =>
      !normalized || service.name.toLowerCase().includes(normalized)
    );
    matchCount += visibleServices.length;
    if (normalized && !visibleServices.length) return "";

    const expanded = Boolean(normalized) || state.activeCategory === category.id;
    const selectedCount = category.services.filter((service) => state.selectedIds.has(service.id)).length;
    return `
      <section class="mobile-service-category${expanded ? " is-expanded" : ""}">
        <button
          class="mobile-category-toggle"
          type="button"
          aria-expanded="${expanded}"
          aria-controls="mobile-category-${category.id}"
          data-category-target="${category.id}"
        >
          <span><strong>${escapeHtml(category.name)}</strong><small>${visibleServices.length} ${visibleServices.length === 1 ? "service" : "services"}${selectedCount ? ` · ${selectedCount} selected` : ""}</small></span>
          <i aria-hidden="true"></i>
        </button>
        <div class="mobile-category-services" id="mobile-category-${category.id}" ${expanded ? "" : "hidden"}>
          ${visibleServices.map(serviceOptionMarkup).join("")}
        </div>
      </section>
    `;
  }).join("");

  elements.emptyServices.hidden = matchCount > 0;
}

function renderServices(query = "") {
  const normalized = query.trim().toLowerCase();
  if (mobileBookingQuery.matches) renderMobileServices(normalized);
  else renderDesktopServices(normalized);
  updateNavigation();
}

function syncStaffChoices() {
  document.querySelectorAll("[data-staff-option]").forEach((button) => {
    const selected = button.dataset.staffOption === state.staff;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  elements.staff.value = state.staff;
}

function setMobileSelection(view) {
  state.mobileSelection = view === "staff" ? "staff" : "services";
  const staffActive = state.mobileSelection === "staff";
  document.querySelectorAll("[data-mobile-selection]").forEach((button) => {
    const selected = button.dataset.mobileSelection === state.mobileSelection;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  elements.mobileServicePanel.hidden = mobileBookingQuery.matches && staffActive;
  elements.mobileStaffPanel.hidden = !mobileBookingQuery.matches || !staffActive;
  elements.serviceSearch.closest(".service-search").hidden = mobileBookingQuery.matches && staffActive;
  saveState();
}

function formatShortDate(iso) {
  if (!iso) return "Choose a date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseIsoDate(iso));
}

function setMobileDockReview(label, summary) {
  elements.mobileDockLabel.textContent = label;
  elements.mobileDockSummary.textContent = summary;
  elements.mobileDockSummaryButton?.setAttribute(
    "aria-label",
    `${label}: ${summary}. Tap to review your appointment summary.`
  );
}

function updateMobileDock() {
  if (!elements.mobileDock) return;
  const services = selectedServices();
  const hasServices = services.length > 0;
  const hasSchedule = Boolean(state.selectedDate && state.selectedTime);
  const confirmed = !elements.confirmation.hidden;

  elements.mobileDock.hidden = confirmed;
  if (confirmed) return;

  elements.mobileDockSummaryButton?.classList.toggle("has-selection", hasServices);
  const serviceCount = `${services.length} ${services.length === 1 ? "service" : "services"}`;

  if (state.step === 1) {
    setMobileDockReview(
      "Your services",
      hasServices
        ? `${serviceCount} · ${totalDuration() ? formatDuration(totalDuration()) : "Consultation"}`
        : "0 services"
    );
    elements.mobilePrimary.textContent = hasServices ? "Continue" : "Choose a service";
    elements.mobilePrimary.disabled = !hasServices;
    return;
  }

  if (state.step === 2) {
    const schedule = state.selectedDate
      ? `${formatShortDate(state.selectedDate)} · ${state.selectedTime ? formatTime(state.selectedTime) : "Choose time"}`
      : state.staff;
    setMobileDockReview("Your appointment", `${serviceCount} · ${schedule}`);
    elements.mobilePrimary.textContent = hasSchedule ? "Continue" : "Choose a time";
    elements.mobilePrimary.disabled = !hasSchedule;
    return;
  }

  setMobileDockReview(
    "Review booking",
    hasSchedule
      ? `${serviceCount} · ${formatShortDate(state.selectedDate)} · ${formatTime(state.selectedTime)}`
      : `${serviceCount} · Review appointment`
  );
  elements.mobilePrimary.textContent = "Send request";
  elements.mobilePrimary.disabled = false;
}

function openSummarySheet() {
  if (!mobileBookingQuery.matches || !elements.summarySheet) return;
  elements.summarySheet.classList.add("is-open");
  elements.summarySheet.setAttribute("role", "dialog");
  elements.summarySheet.setAttribute("aria-modal", "true");
  elements.summaryBackdrop.hidden = false;
  document.body.classList.add("booking-sheet-open");
  window.setTimeout(() => {
    elements.summarySheet.querySelector("[data-summary-close]")?.focus({ preventScroll: true });
  }, 240);
}

function closeSummarySheet(restoreFocus = false) {
  if (!elements.summarySheet) return;
  elements.summarySheet.classList.remove("is-open");
  elements.summarySheet.removeAttribute("role");
  elements.summarySheet.removeAttribute("aria-modal");
  elements.summaryBackdrop.hidden = true;
  document.body.classList.remove("booking-sheet-open");
  if (restoreFocus && mobileBookingQuery.matches) {
    document.querySelector("[data-summary-open]")?.focus({ preventScroll: true });
  }
}

function toggleService(id) {
  if (!serviceMap.has(id)) return;
  if (state.selectedIds.has(id)) state.selectedIds.delete(id);
  else state.selectedIds.add(id);

  state.selectedTime = "";
  state.busyIntervals = [];
  saveState();
  renderServices(elements.serviceSearch.value);
  renderSummary();
  renderTimes();
}

function removeService(id) {
  if (!state.selectedIds.delete(id)) return;
  state.selectedTime = "";
  state.busyIntervals = [];
  saveState();
  renderServices(elements.serviceSearch.value);
  renderSummary();
  renderTimes();
}

function renderSummary() {
  const services = selectedServices();
  elements.summaryCount.textContent = `${services.length} ${services.length === 1 ? "service" : "services"}`;
  elements.summaryEmpty.hidden = services.length > 0;
  elements.summaryServices.innerHTML = services.map((service) => `
    <div class="summary-service">
      <strong>${escapeHtml(service.name)}</strong>
      <small>${service.duration ? `${service.duration} minutes` : "Consultation required"}</small>
      <button type="button" data-remove-service="${service.id}" aria-label="Remove ${escapeHtml(service.name)}">×</button>
    </div>
  `).join("");

  elements.summaryDate.textContent = state.selectedDate ? formatLongDate(state.selectedDate) : "Not selected";
  elements.summaryTime.textContent = state.selectedTime ? formatTime(state.selectedTime) : "Not selected";
  elements.summaryStaff.textContent = state.staff;
  elements.summaryDuration.textContent = totalDuration() ? formatDuration(totalDuration()) : (services.length ? "Consultation" : "0 min");
  elements.durationPill.textContent = `${formatDuration(schedulingDuration())} visit`;
  updateNavigation();
}

function updateNavigation() {
  const hasServices = state.selectedIds.size > 0;
  const hasSchedule = Boolean(state.selectedDate && state.selectedTime);
  document.querySelectorAll('[data-next-step="2"]').forEach((button) => { button.disabled = !hasServices; });
  document.querySelectorAll('[data-next-step="3"]').forEach((button) => { button.disabled = !hasSchedule; });
  document.querySelectorAll('[data-step-nav="2"]').forEach((button) => { button.disabled = !hasServices; });
  document.querySelectorAll('[data-step-nav="3"]').forEach((button) => { button.disabled = !hasSchedule; });
  updateMobileDock();
}

function setStep(step) {
  if (step === 2 && !state.selectedIds.size) return;
  if (step === 3 && !(state.selectedDate && state.selectedTime)) return;
  state.step = step;
  document.body.dataset.bookingStep = String(step);
  closeSummarySheet();

  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const active = Number(panel.dataset.panel) === step;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  document.querySelectorAll("[data-step-nav]").forEach((button) => {
    const buttonStep = Number(button.dataset.stepNav);
    button.classList.toggle("is-active", buttonStep === step);
    button.classList.toggle("is-complete", buttonStep < step);
    if (buttonStep === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  if (step === 2) {
    renderCalendar();
    if (state.selectedDate) loadAvailability(state.selectedDate);
  }

  updateMobileDock();
  document.querySelector(".booking-progress")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const gridStart = addDays(firstOfMonth(state.currentMonth), -firstOfMonth(state.currentMonth).getDay());
  elements.calendarTitle.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(state.currentMonth);

  elements.calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const iso = toIsoDate(date);
    const outside = date.getMonth() !== month;
    const disabled = date < today || date > lastBookableDate;
    const selected = iso === state.selectedDate;
    const todayClass = iso === toIsoDate(today);
    return `
      <button
        class="calendar-day${outside ? " is-outside" : ""}${selected ? " is-selected" : ""}${todayClass ? " is-today" : ""}"
        type="button"
        role="gridcell"
        data-date="${iso}"
        aria-label="${escapeHtml(formatLongDate(iso))}"
        aria-selected="${selected}"
        ${disabled ? "disabled" : ""}
      >${date.getDate()}</button>
    `;
  }).join("");

  const currentFirst = firstOfMonth(today);
  const lastFirst = firstOfMonth(lastBookableDate);
  elements.calendarPrev.disabled = state.currentMonth <= currentFirst;
  elements.calendarNext.disabled = state.currentMonth >= lastFirst;
}

async function selectDate(iso) {
  if (!isBookableIsoDate(iso)) return;
  state.selectedDate = iso;
  state.selectedTime = "";
  state.currentMonth = firstOfMonth(parseIsoDate(iso));
  state.busyIntervals = [];
  saveState();
  renderCalendar();
  renderSummary();
  await loadAvailability(iso);
}

function businessHours(date) {
  const day = date.getDay();
  if (day === 0) return { open: 11 * 60, close: 17 * 60 };
  if (day === 6) return { open: 9 * 60, close: 18 * 60 + 30 };
  return { open: 9 * 60 + 30, close: 19 * 60 };
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(value, amount) {
  return minutesToTime(timeToMinutes(value) + amount);
}

function formatTime(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatLongDate(iso) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(parseIsoDate(iso));
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function overlapsBusyInterval(start, duration) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = startMinutes + duration;
  return state.busyIntervals.some((interval) => {
    const busyStart = timeToMinutes(interval.start);
    const busyEnd = timeToMinutes(interval.end);
    return startMinutes < busyEnd && endMinutes > busyStart;
  });
}

function renderTimes() {
  elements.selectedDateLabel.textContent = state.selectedDate ? formatLongDate(state.selectedDate) : "Select a date";
  if (!state.selectedDate) {
    elements.timeGroups.innerHTML = "";
    elements.availabilityMessage.textContent = "Choose a date to see times.";
    updateNavigation();
    return;
  }

  const date = parseIsoDate(state.selectedDate);
  const { open, close } = businessHours(date);
  const duration = schedulingDuration();
  const now = new Date();
  const isToday = state.selectedDate === toIsoDate(today);
  const earliestToday = now.getHours() * 60 + now.getMinutes() + 30;
  const groups = { Morning: [], Afternoon: [], Evening: [] };

  for (let minutes = open; minutes + duration <= close; minutes += 15) {
    const value = minutesToTime(minutes);
    const disabled = (isToday && minutes < earliestToday) || overlapsBusyInterval(value, duration);
    const label = minutes < 12 * 60 ? "Morning" : minutes < 17 * 60 ? "Afternoon" : "Evening";
    groups[label].push({ value, disabled });
  }

  elements.timeGroups.innerHTML = Object.entries(groups).filter(([, slots]) => slots.length).map(([label, slots]) => `
    <section class="time-group">
      <h4>${label}</h4>
      <div class="time-options">
        ${slots.map((slot) => `
          <button
            class="time-option${slot.value === state.selectedTime ? " is-selected" : ""}"
            type="button"
            data-time="${slot.value}"
            aria-pressed="${slot.value === state.selectedTime}"
            ${slot.disabled ? "disabled" : ""}
          >${formatTime(slot.value)}</button>
        `).join("")}
      </div>
    </section>
  `).join("");

  const availableCount = Object.values(groups).flat().filter((slot) => !slot.disabled).length;
  if (!elements.availabilityMessage.classList.contains("is-error")) {
    elements.availabilityMessage.textContent = availableCount
      ? `${availableCount} start times available for this visit.`
      : "No times fit this visit on the selected date. Try another day.";
  }
  updateNavigation();
}

async function loadAvailability(iso) {
  const requestNumber = ++state.availabilityRequest;
  elements.availabilityMessage.classList.remove("is-error");
  elements.availabilityMessage.textContent = "Checking live availability…";
  renderTimes();

  try {
    const params = new URLSearchParams({
      action: "availability",
      date: iso,
      duration: String(schedulingDuration())
    });
    const response = await fetch(`${bookingApiUrl}?${params}`, { headers: { accept: "application/json" } });
    const data = await readApiJson(response);
    if (!response.ok || !data.ok) throw new Error(data.message || "Availability is temporarily unavailable.");
    if (requestNumber !== state.availabilityRequest) return;
    state.busyIntervals = Array.isArray(data.busyIntervals) ? data.busyIntervals : [];
    elements.availabilityMessage.classList.remove("is-error");
    renderTimes();
  } catch {
    if (requestNumber !== state.availabilityRequest) return;
    state.busyIntervals = [];
    elements.availabilityMessage.classList.add("is-error");
    elements.availabilityMessage.textContent = "Live availability is being connected. Your selected time will be checked when you send the request.";
    renderTimes();
  }
}

function selectTime(value) {
  state.selectedTime = value;
  saveState();
  renderTimes();
  renderSummary();
}

function validateForm() {
  let firstInvalid = null;
  elements.form.querySelectorAll("[required]").forEach((field) => {
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    if (!valid && !firstInvalid) firstInvalid = field;
  });
  firstInvalid?.focus();
  return !firstInvalid;
}

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `tyra-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readApiJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("The booking service returned an unexpected response. Please refresh and try again.");
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("The booking service returned an unexpected response. Please refresh and try again.");
  }
}

function requestIdFor(payload) {
  const fingerprint = JSON.stringify({
    customer: payload.customer,
    appointment: payload.appointment,
    services: payload.services,
    notes: payload.notes,
    company: payload.company
  });

  if (!pendingRequestId || pendingRequestFingerprint !== fingerprint) {
    pendingRequestId = createRequestId();
    pendingRequestFingerprint = fingerprint;
  }
  return pendingRequestId;
}

function friendlySubmitError(error) {
  const message = error instanceof Error ? error.message : "";
  if (message && !/(unexpected token|failed to fetch|networkerror|not valid json)/i.test(message)) return message;
  return "We could not send the request. Please check your connection and try again, or call the salon.";
}

async function submitBooking(event) {
  event.preventDefault();
  elements.formStatus.textContent = "";
  elements.formStatus.classList.remove("is-success");

  if (!validateForm()) {
    elements.formStatus.textContent = "Please complete the required fields before sending your request.";
    return;
  }

  if (!state.selectedIds.size || !state.selectedDate || !state.selectedTime) {
    elements.formStatus.textContent = "Your services, date, or time selection is missing.";
    return;
  }

  const formData = new FormData(elements.form);
  const services = selectedServices();
  const duration = schedulingDuration();
  const payload = {
    createdAt: new Date().toISOString(),
    clientStartedAt: new Date(startedAt).toISOString(),
    customer: {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim()
    },
    appointment: {
      date: state.selectedDate,
      startTime: state.selectedTime,
      endTime: addMinutesToTime(state.selectedTime, duration),
      duration,
      staff: state.staff
    },
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: service.price,
      priceLabel: service.priceLabel
    })),
    notes: String(formData.get("notes") || "").trim(),
    company: String(formData.get("company") || ""),
    source: "tyrahairstudio.com/booking",
    locale: navigator.language || "en-US"
  };
  payload.requestId = requestIdFor(payload);

  const submitButton = elements.form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  elements.submitLabel.textContent = "Sending securely…";

  try {
    const response = await fetch(bookingApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await readApiJson(response);

    if (!response.ok || !data.ok) {
      if (data.code === "SLOT_UNAVAILABLE") {
        state.selectedTime = "";
        saveState();
        renderSummary();
        await loadAvailability(state.selectedDate);
        setStep(2);
        throw new Error("That time was just taken. Please choose another available time.");
      }
      throw new Error(data.message || "We could not send the request. Please try again or call the salon.");
    }

    pendingRequestId = "";
    pendingRequestFingerprint = "";
    showConfirmation(data.bookingId || payload.requestId, payload);
  } catch (error) {
    elements.formStatus.textContent = friendlySubmitError(error);
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
    elements.submitLabel.textContent = "Send appointment request";
  }
}

function showConfirmation(bookingId, payload) {
  closeSummarySheet();
  document.body.dataset.bookingStep = "complete";
  document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = true; });
  elements.confirmation.hidden = false;
  elements.confirmationTicket.innerHTML = `
    <div><span>Request</span><strong>${escapeHtml(bookingId)}</strong></div>
    <div><span>Date</span><strong>${escapeHtml(formatLongDate(payload.appointment.date))}</strong></div>
    <div><span>Time</span><strong>${escapeHtml(formatTime(payload.appointment.startTime))}</strong></div>
    <div><span>Name</span><strong>${escapeHtml(payload.customer.name)}</strong></div>
  `;
  sessionStorage.removeItem(storageKey);
  updateMobileDock();
  elements.confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetBooking() {
  state.step = 1;
  state.selectedIds.clear();
  state.activeCategory = serviceCatalog[0].id;
  state.selectedDate = "";
  state.selectedTime = "";
  state.staff = "TYRA";
  state.mobileSelection = "services";
  state.busyIntervals = [];
  state.currentMonth = firstOfMonth(today);
  elements.form.reset();
  elements.confirmation.hidden = true;
  sessionStorage.removeItem(storageKey);
  renderServices();
  renderCalendar();
  renderTimes();
  renderSummary();
  syncStaffChoices();
  setMobileSelection("services");
  setStep(1);
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (target.closest("[data-summary-close]")) {
    closeSummarySheet(true);
    return;
  }

  if (target.closest("[data-summary-open]")) {
    openSummarySheet();
    return;
  }

  if (target.closest("[data-mobile-primary]")) {
    if (state.step === 1) setStep(2);
    else if (state.step === 2) setStep(3);
    else elements.form.requestSubmit();
    return;
  }

  const mobileSelectionButton = target.closest("[data-mobile-selection]");
  if (mobileSelectionButton) return setMobileSelection(mobileSelectionButton.dataset.mobileSelection);

  const staffOption = target.closest("[data-staff-option]");
  if (staffOption) {
    state.staff = staffChoices.includes(staffOption.dataset.staffOption)
      ? staffOption.dataset.staffOption
      : "TYRA";
    saveState();
    syncStaffChoices();
    renderSummary();
    return;
  }

  const serviceButton = target.closest("[data-service-id]");
  if (serviceButton) return toggleService(serviceButton.dataset.serviceId);

  const removeButton = target.closest("[data-remove-service]");
  if (removeButton) return removeService(removeButton.dataset.removeService);

  const categoryButton = target.closest("[data-category-target]");
  if (categoryButton) {
    state.activeCategory = mobileBookingQuery.matches && state.activeCategory === categoryButton.dataset.categoryTarget
      ? ""
      : categoryButton.dataset.categoryTarget;
    elements.serviceSearch.value = "";
    saveState();
    renderServices();
    return;
  }

  const next = target.closest("[data-next-step]");
  if (next) return setStep(Number(next.dataset.nextStep));

  const previous = target.closest("[data-prev-step]");
  if (previous) return setStep(Number(previous.dataset.prevStep));

  const stepNav = target.closest("[data-step-nav]");
  if (stepNav && !stepNav.disabled) return setStep(Number(stepNav.dataset.stepNav));

  const dateButton = target.closest("[data-date]");
  if (dateButton && !dateButton.disabled) return selectDate(dateButton.dataset.date);

  const timeButton = target.closest("[data-time]");
  if (timeButton && !timeButton.disabled) return selectTime(timeButton.dataset.time);

  if (target.closest("[data-calendar-prev]")) {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    return renderCalendar();
  }

  if (target.closest("[data-calendar-next]")) {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    return renderCalendar();
  }

  if (target.closest("[data-new-booking]")) resetBooking();
});

elements.serviceSearch.addEventListener("input", (event) => renderServices(event.target.value));
elements.staff.addEventListener("change", (event) => {
  state.staff = event.target.value;
  saveState();
  syncStaffChoices();
  renderSummary();
});
elements.form.addEventListener("submit", submitBooking);
elements.form.addEventListener("input", (event) => {
  if (event.target.matches("[aria-invalid='true']")) event.target.removeAttribute("aria-invalid");
});

mobileBookingQuery.addEventListener("change", () => {
  if (!mobileBookingQuery.matches) closeSummarySheet();
  setMobileSelection(state.mobileSelection);
  renderServices(elements.serviceSearch.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.summarySheet.classList.contains("is-open")) {
    closeSummarySheet(true);
  }
});

syncStaffChoices();
setMobileSelection(state.mobileSelection);
renderServices();
renderCalendar();
renderTimes();
renderSummary();
