const siteUrl = "/content/site.json";
const postsUrl = "/content/posts.json";
const hairLooks = [
  {
    label: "Creamy blonde waves",
    src: "/images/hair/01_blonde_waves_back.jpg",
    coverSrc: "/images/covers/cover-01-blonde-waves-back.jpg",
    webpWidth: 286,
    position: "50% 44%"
  },
  {
    label: "Blonde balayage",
    src: "/images/hair/02_blonde_balayage_side.jpg",
    coverSrc: "/images/covers/cover-02-blonde-balayage-side.jpg",
    webpWidth: 263,
    position: "50% 42%"
  },
  {
    label: "Glass blonde",
    src: "/images/hair/03_straight_blonde_back.jpg",
    coverSrc: "/images/covers/cover-03-straight-blonde-back.jpg",
    webpWidth: 258,
    position: "50% 43%"
  },
  {
    label: "Chocolate waves",
    src: "/images/hair/04_dark_brown_waves_back.jpg",
    coverSrc: "/images/covers/cover-04-dark-brown-waves-back.jpg",
    webpWidth: 227,
    position: "50% 42%"
  },
  {
    label: "Copper glow",
    src: "/images/hair/05_copper_straight_side.jpg",
    coverSrc: "/images/covers/cover-05-copper-straight-side.jpg",
    webpWidth: 288,
    position: "50% 42%"
  },
  {
    label: "Brunette balayage",
    src: "/images/hair/06_brunette_balayage_waves.jpg",
    coverSrc: "/images/covers/cover-06-brunette-balayage-waves.jpg",
    webpWidth: 263,
    position: "50% 43%"
  },
  {
    label: "Light blonde movement",
    src: "/images/hair/07_light_blonde_waves_back.jpg",
    coverSrc: "/images/covers/cover-07-light-blonde-waves-back.jpg",
    webpWidth: 258,
    position: "50% 43%"
  },
  {
    label: "Purple ombre",
    src: "/images/hair/08_black_purple_ombre_side.jpg",
    coverSrc: "/images/covers/cover-08-black-purple-ombre-side.jpg",
    webpWidth: 220,
    position: "50% 42%"
  }
];

const serviceImages = [
  hairLooks[0],
  hairLooks[1],
  hairLooks[5],
  hairLooks[2],
  hairLooks[7],
  hairLooks[4],
  hairLooks[6],
  hairLooks[3]
];

const heroLooks = [
  {
    label: "Brunette studio waves",
    coverSrc: "/images/covers/tyra-cover-01-brunette-waves.jpg",
    position: "54% 14%",
    mobilePosition: "67% 50%"
  },
  {
    label: "Champagne blonde movement",
    coverSrc: "/images/covers/tyra-cover-02-champagne-blonde.jpg",
    position: "50% 10%",
    mobilePosition: "66% 50%"
  },
  {
    label: "Copper layered gloss",
    coverSrc: "/images/covers/tyra-cover-03-copper-layers.jpg",
    position: "52% 12%",
    mobilePosition: "66% 50%"
  },
  {
    label: "Glossy black waves",
    coverSrc: "/images/covers/tyra-cover-04-glossy-black.jpg",
    position: "54% 12%",
    mobilePosition: "67% 50%"
  },
  {
    label: "Ash blonde waves",
    coverSrc: "/images/covers/tyra-cover-05-ash-blonde.jpg",
    position: "50% 10%",
    mobilePosition: "66% 50%"
  }
];

const heroWidths = [960, 1440, 1920];

const webpPath = (src, width) => src.replace(/\.(png|jpe?g)$/i, `-${width}.webp`);

const webpSrcset = (src, widths) => widths.map((width) => `${webpPath(src, width)} ${width}w`).join(", ");

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));

const renderServiceDetails = (service) => {
  if (Array.isArray(service.items) && service.items.length) {
    return `
      <ul class="service-list">
        ${service.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  return `
    ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
    ${service.price ? `<strong>${escapeHtml(service.price)}</strong>` : ""}
  `;
};

const text = (selector, value) => {
  const node = document.querySelector(selector);
  if (node && value) node.textContent = value;
};

const textAll = (selector, value) => {
  if (!value) return;
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
};

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
}

function renderHeroSlideshow() {
  const heroMedia = document.querySelector("[data-hero-slideshow]");
  if (!heroMedia) return;

  heroMedia.innerHTML = heroLooks
    .map(
      (look, index) => `
        <picture
          class="hero-slide${index === 0 ? " is-active" : ""}"
          style="--hero-position: ${look.position}; --hero-mobile-position: ${look.mobilePosition}"
        >
          <source type="image/webp" srcset="${webpSrcset(look.coverSrc, heroWidths)}" sizes="100vw">
          <img
            src="${look.coverSrc}"
            alt=""
            draggable="false"
            loading="${index === 0 ? "eager" : "lazy"}"
            decoding="async"
          >
        </picture>
      `
    )
    .join("");

  const slides = Array.from(heroMedia.querySelectorAll(".hero-slide"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = heroMedia.closest(".hero");
  if (slides.length < 2 || !hero) return;

  let current = 0;
  let rotationTimer;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let isDragging = false;

  const showSlide = (nextIndex, direction = 1) => {
    if (nextIndex === current) return;
    const previous = slides[current];
    const next = slides[(nextIndex + slides.length) % slides.length];
    current = slides.indexOf(next);

    slides.forEach((slide) => {
      slide.classList.remove("is-next", "is-leaving");
    });

    next.style.setProperty("--slide-enter-x", `${direction * 8}%`);
    previous.style.setProperty("--slide-exit-x", `${direction * -7}%`);
    next.classList.add("is-next");

    requestAnimationFrame(() => {
      previous.classList.remove("is-active");
      previous.classList.add("is-leaving");
      next.classList.remove("is-next");
      next.classList.add("is-active");
    });
  };

  const startRotation = () => {
    if (reduceMotion) return;
    window.clearInterval(rotationTimer);
    rotationTimer = window.setInterval(() => {
      showSlide(current + 1, 1);
    }, 5000);
  };

  const trackDrag = (event) => {
    if (!isDragging) return;
    lastX = event.clientX;
    lastY = event.clientY;
  };

  const finishDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    hero.classList.remove("is-dragging");
    window.removeEventListener("pointermove", trackDrag);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", finishDrag);

    const deltaX = lastX - startX;
    const deltaY = lastY - startY;
    const threshold = Math.min(110, Math.max(48, hero.clientWidth * 0.08));

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      showSlide(current + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
      startRotation();
    }
  };

  hero.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("a, button")) return;
    isDragging = true;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    hero.classList.add("is-dragging");
    window.clearInterval(rotationTimer);
    window.addEventListener("pointermove", trackDrag);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  });

  startRotation();
}

function initMobileMenu() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav-links]");
  if (!header || !toggle || !nav) return;

  const mobileMenuQuery = window.matchMedia("(max-width: 980px)");
  const setOpen = (isOpen) => {
    header.classList.toggle("is-menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-menu-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  mobileMenuQuery.addEventListener("change", () => {
    if (!mobileMenuQuery.matches) setOpen(false);
  });
}

function initRosefall() {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotionQuery.matches) return;

  if (!document.querySelector("[data-rosefall-style]")) {
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = "/rosefall.css";
    styleLink.setAttribute("data-rosefall-style", "");
    document.head.appendChild(styleLink);
  }

  const layer = document.createElement("div");
  layer.className = "rosefall";
  layer.setAttribute("aria-hidden", "true");

  const isSmallScreen = window.matchMedia("(max-width: 680px)").matches;
  const roseCount = isSmallScreen ? 10 : 18;

  for (let index = 0; index < roseCount; index += 1) {
    const rose = document.createElement("span");
    rose.className = "rose-bloom";
    rose.style.setProperty("--fall-x", `${(index * 29 + 7) % 100}vw`);
    rose.style.setProperty("--fall-drift", `${(index % 2 === 0 ? 1 : -1) * (32 + (index % 5) * 16)}px`);
    rose.style.setProperty("--fall-duration", `${12 + (index % 6) * 1.6}s`);
    rose.style.setProperty("--fall-delay", `${-((index * 1.45) % 13)}s`);
    rose.style.setProperty("--fall-size", `${16 + (index % 5) * 4}px`);
    rose.style.setProperty("--fall-spin", `${index % 2 === 0 ? 1 : -1}`);
    layer.appendChild(rose);
  }

  document.body.appendChild(layer);

  reduceMotionQuery.addEventListener("change", (event) => {
    if (event.matches) layer.remove();
  });
}

function renderSite(site) {
  document.title = `${site.brand} | Cypress, TX`;
  const address = site.addressLines.join(", ");
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  text("[data-intro]", site.intro);
  text("[data-headline]", site.headline);
  text("[data-top-address]", address);
  textAll("[data-footer-address]", address);
  textAll("[data-phone-text]", site.phone);

  document.querySelectorAll("[data-booking]").forEach((link) => {
    link.href = site.bookingUrl;
  });

  document.querySelectorAll("[data-phone-link]").forEach((link) => {
    link.href = `tel:${site.phone.replace(/[^\d+]/g, "")}`;
  });

  document.querySelectorAll("[data-directions]").forEach((link) => {
    link.href = directionsUrl;
  });

  document.querySelectorAll("[data-email]").forEach((link) => {
    link.href = `mailto:${site.email}`;
  });

  textAll("[data-email-text]", site.email);

  document.querySelectorAll("[data-facebook]").forEach((link) => {
    link.href = site.facebook || "https://www.facebook.com/profile.php?id=61590465365520";
  });

  const serviceGrid = document.querySelector("[data-services]");
  if (serviceGrid) {
    serviceGrid.innerHTML = site.services
      .map(
        (service, index) => {
          const image = serviceImages[index % serviceImages.length];
          return `
          <article class="service-card">
            <div class="service-card-visual" style="--service-image: url('${webpPath(image.src, image.webpWidth)}'); --service-position: ${image.position}"></div>
            <div class="service-card-content">
              <h3>${escapeHtml(service.name)}</h3>
              ${renderServiceDetails(service)}
            </div>
          </article>
        `;
        }
      )
      .join("");
  }

  const lookTiles = document.querySelector("[data-looks]");
  if (lookTiles) {
    const galleryLooks = hairLooks.map((image, index) => ({
      ...image,
      label: site.looks[index] || image.label
    }));

    lookTiles.innerHTML = galleryLooks
      .map(
        (look, index) => `
          <article class="look-tile">
            <picture>
              <source type="image/webp" srcset="${webpPath(look.src, look.webpWidth)}">
              <img src="${look.src}" alt="${escapeHtml(look.label)}" loading="lazy" decoding="async" style="object-position: ${look.position}">
            </picture>
            <span>${escapeHtml(look.label)}</span>
          </article>
        `
      )
      .join("");
  }

  document.querySelectorAll("[data-hours]").forEach((hours) => {
    hours.innerHTML = site.hours
      .map(
        (item) => `
          <div>
            <dt>${escapeHtml(item.day)}</dt>
            <dd>${escapeHtml(item.time)}</dd>
          </div>
        `
      )
      .join("");
  });
}

function renderPosts(posts) {
  const grid = document.querySelector("[data-posts]");
  if (!grid) return;

  grid.innerHTML = posts
    .map(
      (post, index) => `
        <button class="post-card" type="button" data-post-index="${index}">
          <span>${escapeHtml(post.category)}</span>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <span class="read-more">Read article</span>
        </button>
      `
    )
    .join("");

  grid.querySelectorAll("[data-post-index]").forEach((button) => {
    button.addEventListener("click", () => openPost(posts[Number(button.dataset.postIndex)]));
  });
}

function openPost(post) {
  const modal = document.querySelector("[data-modal]");
  text("[data-modal-category]", post.category);
  text("[data-modal-title]", post.title);
  text("[data-modal-date]", formatDate(post.date));
  document.querySelector("[data-modal-body]").innerHTML = post.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close").focus();
}

function closePost() {
  const modal = document.querySelector("[data-modal]");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", closePost));
document.addEventListener("keydown", (event) => {
  const modal = document.querySelector("[data-modal]");
  if (event.key === "Escape" && modal && !modal.hidden) closePost();
});

initMobileMenu();
renderHeroSlideshow();
initRosefall();

Promise.all([loadJson(siteUrl), loadJson(postsUrl)])
  .then(([site, blog]) => {
    renderSite(site);
    renderPosts(blog.posts);
  })
  .catch(() => {
    const postGrid = document.querySelector("[data-posts]");
    if (postGrid) postGrid.innerHTML = '<p class="load-error">The journal is taking a moment to load.</p>';
  });
