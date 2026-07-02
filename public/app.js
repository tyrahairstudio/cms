const siteUrl = "/content/site.json";
const postsUrl = "/content/posts.json";
const tilePositions = ["69% 22%", "88% 24%", "79% 18%", "43% 78%", "56% 78%", "90% 78%"];
const servicePositions = ["69% 22%", "88% 24%", "80% 34%", "43% 78%", "56% 78%", "90% 78%"];

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

function renderSite(site) {
  document.title = `${site.brand} | Cypress, TX`;
  const address = site.addressLines.join(", ");
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  text("[data-intro]", site.intro);
  text("[data-headline]", site.headline);
  text("[data-top-address]", address);
  text("[data-footer-address]", address);
  text("#visit-title", address);
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

  const emailLink = document.querySelector("[data-email]");
  if (emailLink) emailLink.href = `mailto:${site.email}`;

  const serviceGrid = document.querySelector("[data-services]");
  if (serviceGrid) {
    serviceGrid.innerHTML = site.services
      .map(
        (service, index) => `
          <article class="service-card">
            <div class="service-card-visual" style="--service-image: url('/assets/tyra-cover.png'); --service-position: ${servicePositions[index % servicePositions.length]}"></div>
            <div class="service-card-content">
              <h3>${escapeHtml(service.name)}</h3>
              <p>${escapeHtml(service.description)}</p>
              <strong>${escapeHtml(service.price)}</strong>
            </div>
          </article>
        `
      )
      .join("");
  }

  const lookTiles = document.querySelector("[data-looks]");
  if (lookTiles) {
    lookTiles.innerHTML = site.looks
      .map(
        (look, index) => `
          <article class="look-tile" style="--tile-image: url('/assets/tyra-cover.png'); --tile-position: ${tilePositions[index % tilePositions.length]}">
            <span>${escapeHtml(look)}</span>
          </article>
        `
      )
      .join("");
  }

  const hours = document.querySelector("[data-hours]");
  if (hours) {
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
  }
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
  document.querySelector("[data-modal]").hidden = true;
  document.body.classList.remove("modal-open");
}

document.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", closePost));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.querySelector("[data-modal]").hidden) closePost();
});

Promise.all([loadJson(siteUrl), loadJson(postsUrl)])
  .then(([site, blog]) => {
    renderSite(site);
    renderPosts(blog.posts);
  })
  .catch(() => {
    const postGrid = document.querySelector("[data-posts]");
    if (postGrid) postGrid.innerHTML = '<p class="load-error">The journal is taking a moment to load.</p>';
  });
