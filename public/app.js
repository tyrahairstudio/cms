const siteUrl = "/content/site.json";
const postsUrl = "/content/posts.json";
const galleryUrl = "/content/gallery.json?v=gallery-home-v7";
const galleryHeroIds = ["gallery-015-img-4787", "gallery-073-img-9580", "custom-blonde-blue-shirt"];
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

const serviceImagesByName = {
  "Hair Cuts": {
    src: "/images/services/hair-cuts.webp?v=professional-v2",
    position: "50% 47%"
  },
  "Hair Color": {
    src: "/images/services/hair-color-professional.webp",
    position: "50% 45%"
  },
  "Hair Style": {
    src: "/images/services/hair-style-curling.webp?v=professional-v2",
    position: "48% 50%"
  },
  "Perms": {
    src: "/images/services/perms.webp",
    position: "50% 46%"
  },
  "Treatments": {
    src: "/images/services/treatments.webp",
    position: "50% 52%"
  },
  "Waxing": {
    src: "/images/services/waxing.webp",
    position: "50% 48%"
  },
  "Head Spa": {
    src: "/images/services/head-spa.webp?v=head-spa-relax-v1",
    position: "50% 48%"
  },
  "Free Consultation": {
    src: "/images/services/free-consultation.webp",
    position: "50% 50%"
  }
};

const fallbackServiceImage = serviceImagesByName["Hair Color"];

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

const linkAddressAll = (selector, address, directionsUrl) => {
  if (!address || !directionsUrl) return;
  document.querySelectorAll(selector).forEach((node) => {
    const link = node.matches("a") ? node : document.createElement("a");
    link.href = directionsUrl;
    link.textContent = address;
    link.target = "_blank";
    link.rel = "noopener";
    link.classList.add("address-map-link");
    link.setAttribute("aria-label", `Open Google Maps directions to ${address}`);

    if (link !== node) {
      node.textContent = "";
      node.appendChild(link);
    }
  });
};

const hasOpenOverlay = () =>
  Array.from(document.querySelectorAll("[data-modal], [data-gallery-collection-modal], [data-gallery-lightbox]"))
    .some((node) => !node.hidden);

const releaseModalOpenIfClear = () => {
  if (!hasOpenOverlay()) document.body.classList.remove("modal-open");
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
  const attractor = document.querySelector("[data-rose-attractor]");
  if (!attractor) return;

  if (!document.querySelector("[data-rosefall-style]")) {
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = "/rosefall.css?v=booking-attractor-polish";
    styleLink.setAttribute("data-rosefall-style", "");
    document.head.appendChild(styleLink);
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    viewportHeight
  );
  const attractorRect = attractor.getBoundingClientRect();
  const attractorX = attractorRect.left + window.scrollX + attractorRect.width / 2;
  const attractorY = attractorRect.top + window.scrollY + attractorRect.height / 2;
  const layer = document.createElement("div");
  layer.className = "rosefall";
  layer.setAttribute("aria-hidden", "true");
  layer.style.setProperty("--rosefall-height", `${pageHeight}px`);

  const isSmallScreen = window.matchMedia("(max-width: 680px)").matches;
  const roseCount = Math.min(
    isSmallScreen ? 28 : 46,
    Math.max(isSmallScreen ? 14 : 22, Math.ceil(attractorY / (isSmallScreen ? 150 : 128)))
  );
  const baseDuration = Math.max(14, attractorY / (isSmallScreen ? 130 : 145));

  for (let index = 0; index < roseCount; index += 1) {
    const rose = document.createElement("span");
    const startX = ((index * 29 + 7) % 100) / 100 * viewportWidth;
    const midY = Math.max(viewportHeight * 0.45, attractorY * (0.5 + (index % 4) * 0.045));
    rose.className = "rose-bloom";
    rose.style.setProperty("--fall-x", `${startX}px`);
    rose.style.setProperty("--fall-drift", `${(index % 2 === 0 ? 1 : -1) * (32 + (index % 5) * 16)}px`);
    rose.style.setProperty("--fall-mid-y", `${midY}px`);
    rose.style.setProperty("--fall-target-x", `${attractorX - startX}px`);
    rose.style.setProperty("--fall-target-y", `${attractorY}px`);
    rose.style.setProperty("--fall-near-target-x", `${(attractorX - startX) * 0.82}px`);
    rose.style.setProperty("--fall-near-target-y", `${attractorY * 0.86}px`);
    rose.style.setProperty("--fall-duration", `${baseDuration + (index % 6) * 1.35}s`);
    rose.style.setProperty("--fall-delay", `${-((index * 2.7) % baseDuration)}s`);
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
  const directionsUrl = "https://maps.app.goo.gl/rhgYgCchRQ7YYKUZ7";

  text("[data-intro]", site.intro);
  text("[data-headline]", site.headline);
  linkAddressAll("[data-top-address]", address, directionsUrl);
  linkAddressAll("[data-footer-address]", address, directionsUrl);
  textAll("[data-phone-text]", site.phone);
  textAll("[data-current-year]", String(new Date().getFullYear()));

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
        (service) => {
          const image = serviceImagesByName[service.name] || fallbackServiceImage;
          return `
          <article class="service-card">
            <div class="service-card-visual" style="--service-image: url('${image.src}'); --service-position: ${image.position}"></div>
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

function renderHomeGalleryLooks(gallery) {
  const lookTiles = document.querySelector("[data-looks]");
  if (!lookTiles || !gallery) return;

  const selected = [];
  const seen = new Set();
  const addLook = (item, label = item?.label) => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    selected.push({ ...item, label: label || item.label || "Salon work" });
  };

  (gallery.featured || []).forEach((item) => addLook(item));
  (gallery.collections || []).forEach((collection) => {
    addLook(collection.cover, collection.title);
    (collection.preview || []).slice(0, 1).forEach((item) => addLook(item));
  });

  const homeLooks = selected.slice(0, 8);
  if (!homeLooks.length) return;

  lookTiles.innerHTML = homeLooks
    .map(
      (look) => `
        <button
          class="look-tile${look.backdrop ? " has-backdrop" : ""}"
          type="button"
          data-gallery-image
          data-large="${escapeHtml(look.large || look.display || look.thumb)}"
          data-title="${escapeHtml(look.label)}"
          data-category="${escapeHtml(look.category || "Our Photos")}"
        >
          <picture>
            <source
              type="image/webp"
              srcset="${escapeHtml(look.thumb)} 360w, ${escapeHtml(look.display || look.thumb)} 760w"
              sizes="(max-width: 680px) 76vw, (max-width: 1080px) 24vw, 14vw"
            >
            <img
              src="${escapeHtml(look.display || look.thumb)}"
              alt="${escapeHtml(look.label)}"
              width="${look.width}"
              height="${look.height}"
              loading="lazy"
              decoding="async"
            >
          </picture>
          <span>${escapeHtml(look.label)}</span>
        </button>
      `
    )
    .join("");

  initGalleryLightbox();
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
  releaseModalOpenIfClear();
}

const gallerySrcset = (item) => {
  if (!item.display || item.display === item.thumb) return "";
  return ` srcset="${escapeHtml(item.thumb)} 360w, ${escapeHtml(item.display)} 760w"`;
};

const galleryButton = (item, className = "gallery-photo") => `
  <button
    class="${className}${item.backdrop ? " has-backdrop" : ""}"
    type="button"
    data-gallery-image
    data-large="${escapeHtml(item.large)}"
    data-title="${escapeHtml(item.label)}"
    data-category="${escapeHtml(item.category)}"
  >
    <img
      src="${escapeHtml(item.display || item.thumb)}"
      ${gallerySrcset(item)}
      sizes="(max-width: 680px) 76vw, (max-width: 1180px) 45vw, 32vw"
      alt="${escapeHtml(item.label)}"
      width="${item.width}"
      height="${item.height}"
      loading="lazy"
      decoding="async"
    >
    <span>
      <small>${escapeHtml(item.category)}</small>
      <strong>${escapeHtml(item.label)}</strong>
    </span>
  </button>
`;

const galleryAlbumButton = (item) => `
  <button
    class="gallery-album-photo${item.backdrop ? " has-backdrop" : ""}"
    type="button"
    data-gallery-image
      data-large="${escapeHtml(item.large)}"
    data-title="${escapeHtml(item.label)}"
    data-category="${escapeHtml(item.category)}"
  >
    <img
      src="${escapeHtml(item.thumb)}"
      alt="${escapeHtml(item.label)}"
      width="${item.width}"
      height="${item.height}"
      loading="lazy"
      decoding="async"
    >
  </button>
`;

const collectionCard = (collection) => {
  const cover = collection.cover;
  const preview = collection.preview || [];
  return `
    <button
      class="gallery-collection-card${cover.backdrop ? " has-backdrop" : ""}"
      type="button"
      data-gallery-collection="${escapeHtml(collection.id)}"
    >
      <span class="gallery-collection-cover">
        <img
          src="${escapeHtml(cover.display || cover.thumb)}"
          ${gallerySrcset(cover)}
          sizes="(max-width: 680px) 45vw, (max-width: 1180px) 44vw, 28vw"
          alt=""
          width="${cover.width}"
          height="${cover.height}"
          loading="lazy"
          decoding="async"
        >
      </span>
      <span class="gallery-collection-copy">
        <small>${escapeHtml(collection.kicker)}</small>
        <strong>${escapeHtml(collection.title)}</strong>
        <span>${escapeHtml(collection.description)}</span>
        <em>${collection.count} photos</em>
      </span>
      <span class="gallery-collection-preview" aria-hidden="true">
        ${preview
          .map((item) => `<img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" decoding="async">`)
          .join("")}
      </span>
    </button>
  `;
};

function renderGalleryPage(gallery) {
  const page = document.querySelector("[data-gallery-page]");
  if (!page || !gallery) return;

  const featured = gallery.featured?.length ? gallery.featured : (gallery.items || []).slice(0, 6);
  const transformations = gallery.transformations || [];

  const heroBoard = document.querySelector("[data-gallery-hero-board]");
  if (heroBoard) {
    const heroItems = galleryHeroIds
      .map((id) => featured.find((item) => item.id === id) || (gallery.items || []).find((item) => item.id === id))
      .filter(Boolean);
    const selectedHeroItems = heroItems.length === galleryHeroIds.length ? heroItems : featured.slice(1, 4);

    heroBoard.innerHTML = selectedHeroItems
      .slice(0, 3)
      .map((item, index) => `
        <figure class="gallery-hero-tile tile-${index + 1}${item.backdrop ? " has-backdrop" : ""}">
          <img
            src="${escapeHtml(item.display || item.thumb)}"
            ${gallerySrcset(item)}
            sizes="(max-width: 680px) 30vw, 16vw"
            alt=""
            loading="${index === 0 ? "eager" : "lazy"}"
            decoding="async"
          >
        </figure>
      `)
      .join("");
  }

  const featuredGrid = document.querySelector("[data-gallery-featured]");
  if (featuredGrid) {
    featuredGrid.innerHTML = featured.slice(0, 5).map((item) => galleryButton(item, "gallery-featured-card")).join("");
  }

  const transformationStrip = document.querySelector("[data-gallery-transformations]");
  if (transformationStrip) {
    transformationStrip.innerHTML = transformations
      .map((item) => galleryButton(item, "transformation-card"))
      .join("");
  }

  const collections = document.querySelector("[data-gallery-collections]");
  if (collections) {
    collections.innerHTML = (gallery.collections || []).map(collectionCard).join("");
  }

  const count = document.querySelector("[data-gallery-count]");
  if (count) {
    count.textContent = `${gallery.itemCount} salon photos organized into ${(gallery.collections || []).length} easy albums.`;
  }

  initGalleryCollections(gallery.collections || []);
  initGalleryLightbox();

  if (window.location.hash === "#collections") {
    const alignCollections = () => document.getElementById("collections")?.scrollIntoView({ block: "start" });
    window.requestAnimationFrame(alignCollections);
    window.setTimeout(alignCollections, 400);
  }
}

function initGalleryCollections(collections) {
  const modal = document.querySelector("[data-gallery-collection-modal]");
  if (!modal) return;

  const collectionMap = new Map(collections.map((collection) => [collection.id, collection]));
  const title = modal.querySelector("[data-gallery-collection-title]");
  const kicker = modal.querySelector("[data-gallery-collection-kicker]");
  const description = modal.querySelector("[data-gallery-collection-description]");
  const grid = modal.querySelector("[data-gallery-collection-grid]");
  const closeButton = modal.querySelector("[data-gallery-collection-close]");

  const openCollection = (collection) => {
    title.textContent = collection.title;
    kicker.textContent = `${collection.kicker} / ${collection.count} photos`;
    description.textContent = collection.description;
    grid.innerHTML = collection.items.map((item) => galleryAlbumButton(item)).join("");
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  };

  const close = () => {
    modal.hidden = true;
    grid.innerHTML = "";
    releaseModalOpenIfClear();
  };

  if (!modal.dataset.ready) {
    document.addEventListener("click", (event) => {
      const trigger = event.target instanceof Element ? event.target.closest("[data-gallery-collection]") : null;
      if (!trigger) return;

      const collection = collectionMap.get(trigger.dataset.galleryCollection);
      if (!collection) return;

      openCollection(collection);
    });

    modal.querySelectorAll("[data-gallery-collection-close]").forEach((node) => {
      node.addEventListener("click", close);
    });

    document.addEventListener("keydown", (event) => {
      const lightbox = document.querySelector("[data-gallery-lightbox]");
      if (lightbox && !lightbox.hidden) return;
      if (event.key === "Escape" && !modal.hidden) close();
    });

    modal.dataset.ready = "true";
  }

  modal.collectionMap = collectionMap;

  const deepLinkedId = window.location.hash.startsWith("#album-")
    ? window.location.hash.replace("#album-", "")
    : "";
  if (deepLinkedId && collectionMap.has(deepLinkedId) && modal.hidden) {
    window.requestAnimationFrame(() => openCollection(collectionMap.get(deepLinkedId)));
  }
}

function initGalleryLightbox() {
  const lightbox = document.querySelector("[data-gallery-lightbox]");
  if (!lightbox || lightbox.dataset.ready) return;

  const image = lightbox.querySelector("[data-gallery-lightbox-image]");
  const title = lightbox.querySelector("[data-gallery-lightbox-title]");
  const category = lightbox.querySelector("[data-gallery-lightbox-category]");
  const closeButton = lightbox.querySelector("[data-gallery-lightbox-close]");

  const close = () => {
    lightbox.hidden = true;
    image.removeAttribute("src");
    releaseModalOpenIfClear();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest("[data-gallery-image]") : null;
    if (!trigger) return;

    image.src = trigger.dataset.large;
    image.alt = trigger.dataset.title || "Tyra Hair Studio gallery image";
    title.textContent = trigger.dataset.title || "";
    category.textContent = trigger.dataset.category || "";
    lightbox.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
  });

  lightbox.querySelectorAll("[data-gallery-lightbox-close]").forEach((node) => {
    node.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) close();
  });

  lightbox.dataset.ready = "true";
}

let bookingTransitionTimer;
let bookingTransitionFallbackTimer;

function ensureBookingTransitionOverlay() {
  let overlay = document.querySelector("[data-booking-transition]");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.className = "booking-transition";
  overlay.setAttribute("data-booking-transition", "");
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.setAttribute("aria-atomic", "true");
  overlay.innerHTML = `
    <div class="booking-transition-card">
      <span class="booking-transition-spinner" aria-hidden="true"></span>
      <span class="booking-transition-title">Opening booking</span>
      <span class="booking-transition-copy">Taking you to the appointment calendar.</span>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function clearBookingTransition() {
  window.clearTimeout(bookingTransitionTimer);
  window.clearTimeout(bookingTransitionFallbackTimer);
  document.body.classList.remove("booking-transition-active");
  document.body.removeAttribute("aria-busy");
  document.querySelectorAll("[data-booking].is-booking-loading").forEach((link) => {
    link.classList.remove("is-booking-loading");
    link.removeAttribute("aria-disabled");
  });
  document.querySelector("[data-booking-transition]")?.remove();
}

function shouldHandleBookingClick(event, link) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) {
    return false;
  }

  return Boolean(link.href);
}

function initBookingTransitions() {
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const link = target ? target.closest("[data-booking]") : null;
    if (!link || !shouldHandleBookingClick(event, link)) return;

    event.preventDefault();
    if (document.body.classList.contains("booking-transition-active")) return;

    document.body.classList.add("booking-transition-active");
    document.body.setAttribute("aria-busy", "true");
    link.classList.add("is-booking-loading");
    link.setAttribute("aria-disabled", "true");
    ensureBookingTransitionOverlay();

    window.clearTimeout(bookingTransitionTimer);
    bookingTransitionTimer = window.setTimeout(() => {
      window.location.assign(link.href);
    }, 140);

    bookingTransitionFallbackTimer = window.setTimeout(clearBookingTransition, 12000);
  });

  window.addEventListener("pageshow", clearBookingTransition);
}

document.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", closePost));
document.addEventListener("keydown", (event) => {
  const modal = document.querySelector("[data-modal]");
  if (event.key === "Escape" && modal && !modal.hidden) closePost();
});

initMobileMenu();
renderHeroSlideshow();

Promise.all([
  loadJson(siteUrl),
  loadJson(postsUrl),
  document.querySelector("[data-gallery-page], [data-looks]") ? loadJson(galleryUrl) : Promise.resolve(null)
])
  .then(([site, blog, gallery]) => {
    renderSite(site);
    renderHomeGalleryLooks(gallery);
    renderPosts(blog.posts);
    renderGalleryPage(gallery);
  })
  .catch(() => {
    const postGrid = document.querySelector("[data-posts]");
    if (postGrid) postGrid.innerHTML = '<p class="load-error">The journal is taking a moment to load.</p>';
  })
  .finally(() => {
    window.requestAnimationFrame(() => initRosefall());
  });
