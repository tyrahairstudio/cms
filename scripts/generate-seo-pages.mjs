import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = path.join(projectRoot, "public");
const origin = "https://tyrahairstudio.com";
const bookingUrl = "https://book.gocheckin.net/v3/nail-salon/tyra-hair-studio-20654/choose-service";
const directionsUrl = "https://maps.app.goo.gl/rhgYgCchRQ7YYKUZ7";
const today = new Date().toISOString().slice(0, 10);

const site = JSON.parse(await readFile(path.join(publicDir, "content", "site.json"), "utf8"));
const blog = JSON.parse(await readFile(path.join(publicDir, "content", "posts.json"), "utf8"));

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[character]);

const serviceImages = {
  "Hair Cuts": "/images/services/hair-cuts.webp?v=professional-v2",
  "Hair Color": "/images/services/hair-color-professional.webp",
  "Hair Style": "/images/services/hair-style-curling.webp?v=professional-v2",
  "Perms": "/images/services/perms.webp",
  "Treatments": "/images/services/treatments.webp",
  "Waxing": "/images/services/waxing.webp",
  "Head Spa": "/images/services/head-spa.webp?v=head-spa-relax-v1",
  "Free Consultation": "/images/services/free-consultation.webp"
};

const openingHoursSpecification = site.hours.map(({ day, time }) => {
  const [opensText, closesText] = time.split(" - ");
  const to24Hour = (value) => {
    const match = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return value;
    let hour = Number(match[1]);
    if (match[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
    if (match[3].toLowerCase() === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
  };

  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: day.replace(":", ""),
    opens: to24Hour(opensText),
    closes: to24Hour(closesText)
  };
});

const salonSchema = {
  "@type": "HairSalon",
  "@id": `${origin}/#salon`,
  name: "Tyra Hair Studio",
  url: `${origin}/`,
  image: `${origin}/assets/social-preview.jpg?v=20260704`,
  logo: `${origin}/assets/tyra_hair_studio_logo.png`,
  telephone: "+1-346-666-7580",
  email: site.email,
  priceRange: "$$",
  currenciesAccepted: "USD",
  address: {
    "@type": "PostalAddress",
    streetAddress: "9212 Fry Rd #160",
    addressLocality: "Cypress",
    addressRegion: "TX",
    postalCode: "77433",
    addressCountry: "US"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 29.9165246,
    longitude: -95.7300864
  },
  hasMap: directionsUrl,
  areaServed: {
    "@type": "City",
    name: "Cypress, Texas"
  },
  openingHoursSpecification,
  sameAs: [site.facebook].filter(Boolean),
  potentialAction: {
    "@type": "ReserveAction",
    target: bookingUrl,
    name: "Book a hair appointment"
  }
};

const breadcrumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${origin}${item.path}`
  }))
});

const pageGraph = ({ path: pagePath, title, description, type = "WebPage", trail = [] }) => ({
  "@context": "https://schema.org",
  "@graph": [
    salonSchema,
    {
      "@type": type,
      "@id": `${origin}${pagePath}#webpage`,
      url: `${origin}${pagePath}`,
      name: title,
      description,
      inLanguage: "en-US",
      isPartOf: { "@id": `${origin}/#website` },
      about: { "@id": `${origin}/#salon` }
    },
    breadcrumbs([{ name: "Home", path: "/" }, ...trail])
  ]
});

const existingPages = [
  {
    file: "index.html",
    path: "/",
    title: "Hair Salon in Cypress, TX | Tyra Hair Studio",
    description: "Tyra Hair Studio is a Cypress, TX hair salon for dimensional color, balayage, blonding, highlights, haircuts, gloss, treatments, head spa, and more.",
    type: "WebPage",
    trail: []
  },
  {
    file: path.join("about", "index.html"),
    path: "/about/",
    title: "About Tyra Hair Studio | Cypress, TX Hair Salon",
    description: "Meet Tyra Hair Studio, a welcoming Cypress, TX salon focused on personalized color, blonding, gloss, haircuts, treatments, and healthy-looking results.",
    type: "AboutPage",
    trail: [{ name: "About", path: "/about/" }]
  },
  {
    file: path.join("service", "index.html"),
    path: "/service/",
    title: "Hair Services & Prices in Cypress, TX | Tyra Hair Studio",
    description: "See starting prices for hair color, balayage, highlights, haircuts, perms, keratin, Brazilian Blowout, head spa, styling, and waxing in Cypress, TX.",
    type: "CollectionPage",
    trail: [{ name: "Services", path: "/service/" }]
  },
  {
    file: path.join("gallery", "index.html"),
    path: "/gallery/",
    title: "Hair Color Gallery | Tyra Hair Studio Cypress, TX",
    description: "Browse real Tyra Hair Studio work including blonde, brunette, balayage, vivid color, gloss, and haircut transformations from our Cypress, TX salon.",
    type: "CollectionPage",
    trail: [{ name: "Gallery", path: "/gallery/" }]
  },
  {
    file: path.join("contact", "index.html"),
    path: "/contact/",
    title: "Contact Tyra Hair Studio | Hair Salon in Cypress, TX",
    description: "Visit Tyra Hair Studio at 9212 Fry Rd #160, Cypress, TX 77433. View hours, call (346) 666-7580, get directions, or book online.",
    type: "ContactPage",
    trail: [{ name: "Contact", path: "/contact/" }]
  }
];

function updateExistingHead(html, page) {
  const replacements = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`],
    [/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(page.description)}">`],
    [/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${origin}${page.path}">`],
    [/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${origin}${page.path}">`],
    [/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(page.title)}">`],
    [/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(page.description)}">`],
    [/<meta name="twitter:title" content="[^"]*">/i, `<meta name="twitter:title" content="${escapeHtml(page.title)}">`],
    [/<meta name="twitter:description" content="[^"]*">/i, `<meta name="twitter:description" content="${escapeHtml(page.description)}">`]
  ];

  for (const [pattern, value] of replacements) html = html.replace(pattern, value);

  html = html.replace(/\s*<!-- SEO:HEAD_START -->[\s\S]*?<!-- SEO:HEAD_END -->/i, "");
  html = html.replace(/\s*<!-- SEO:SCHEMA_START -->[\s\S]*?<!-- SEO:SCHEMA_END -->/i, "");

  const headExtras = `
    <!-- SEO:HEAD_START -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta property="og:locale" content="en_US">
    <link rel="alternate" hreflang="en-US" href="${origin}${page.path}">
    <link rel="alternate" hreflang="x-default" href="${origin}${page.path}">
    <!-- SEO:HEAD_END -->`;
  const schema = pageGraph(page);
  if (page.path === "/") {
    schema["@graph"].push({
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: "Tyra Hair Studio",
      inLanguage: "en-US",
      publisher: { "@id": `${origin}/#salon` }
    });
  }
  const schemaBlock = `
    <!-- SEO:SCHEMA_START -->
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <!-- SEO:SCHEMA_END -->`;

  html = html.replace(/[ \t]+$/gm, "");
  return html.replace(/^[ \t]*<\/head>/m, () => `${headExtras}${schemaBlock}\n  </head>`);
}

function renderStaticServices() {
  return site.services.map((service) => `
          <article class="service-card">
            <div class="service-card-visual" role="img" aria-label="${escapeHtml(service.name)} at Tyra Hair Studio" style="--service-image: url('${serviceImages[service.name] || serviceImages["Hair Color"]}'); --service-position: 50% 48%"></div>
            <div class="service-card-content">
              <h3>${escapeHtml(service.name)}</h3>
              <ul class="service-list">
                ${service.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>
            </div>
          </article>`).join("");
}

for (const page of existingPages) {
  const filePath = path.join(publicDir, page.file);
  let html = await readFile(filePath, "utf8");
  html = updateExistingHead(html, page);
  html = html.replace(
    /<!-- SEO:SERVICES_START -->[\s\S]*?<!-- SEO:SERVICES_END -->/,
    `<!-- SEO:SERVICES_START -->${renderStaticServices()}\n          <!-- SEO:SERVICES_END -->`
  );
  await writeFile(filePath, html, "utf8");
}

const landingPages = [
  {
    slug: "hair-color-cypress-tx",
    serviceName: "Hair Color",
    title: "Hair Color in Cypress, TX | Tyra Hair Studio",
    description: "Custom hair color in Cypress, TX including all-over color, gray coverage, highlights, blonding, toner, gloss, vivid color, and color correction consultations.",
    eyebrow: "Custom color · Cypress, Texas",
    h1: "Hair Color in Cypress, TX",
    intro: "Color planned around your hair history, target tone, maintenance routine, and the condition of your hair.",
    h2: "Dimensional color designed for real life.",
    image: "/images/services/hair-color-professional.webp",
    imageWidth: 1085,
    imageHeight: 1449,
    imageAlt: "Dimensional hair color service at Tyra Hair Studio in Cypress, Texas",
    paragraphs: [
      "Tyra Hair Studio offers personalized hair color for clients who want anything from a subtle refresh to a major transformation. Your appointment begins with a conversation about previous color, current condition, inspiration photos, daily styling, and how often you want to return for maintenance.",
      "Available color services include all-over color, gray coverage, partial and full highlights, balayage and ombré, bleach and tone, toner, men’s color, men’s highlights, and correction work. Tone and placement are chosen together so brightness, depth, and the finished cut feel intentional rather than separate.",
      "Color correction requires a consultation because timing and cost depend on the starting canvas. A staged plan may be recommended when that is the safer path for the hair. Final prices can vary with length, density, product use, color history, and the result you want."
    ],
    bullets: [
      "All-over color from $130+ and gray coverage from $75+",
      "Partial highlights from $120+ and full highlights from $180+",
      "Balayage or ombré from $220+",
      "Bleach and tone from $200+; toner from $65+",
      "Complimentary consultation available for color planning"
    ],
    priceLabel: "Hair color starting prices",
    price: "$65+ to $220+ · correction by consultation",
    offers: [
      { name: "All-over hair color", price: "130" },
      { name: "Gray coverage", price: "75" },
      { name: "Full highlights", price: "180" },
      { name: "Toner", price: "65" }
    ],
    faqs: [
      ["How should I prepare for a color appointment?", "Bring clear inspiration photos and be ready to share your recent color history, including at-home color. Arrive with hair in a condition your stylist can assess unless you receive different preparation instructions."],
      ["Do I need a consultation for color correction?", "Yes. Correction work depends on the current color, banding, condition, and target result, so the salon needs to assess the safest sequence before confirming the service plan."],
      ["Why are color prices listed as ‘and up’?", "Hair length, density, previous color, product needed, and appointment time can change the final price. Your stylist can clarify the plan and expected cost after consultation."]
    ]
  },
  {
    slug: "balayage-cypress-tx",
    serviceName: "Balayage & Highlights",
    title: "Balayage & Highlights in Cypress, TX | Tyra Hair Studio",
    description: "Balayage, ombré, partial highlights, full highlights, blonding, toner, and dimensional color in Cypress, TX with consultation-led planning at Tyra Hair Studio.",
    eyebrow: "Balayage & highlights · Cypress, Texas",
    h1: "Balayage & Highlights in Cypress, TX",
    intro: "Soft brightness, intentional dimension, and a maintenance plan that fits how you wear your hair.",
    h2: "Blonding with placement, tone, and hair health in mind.",
    image: "/images/gallery/custom-blonde-blue-shirt-large.webp",
    imageWidth: 1120,
    imageHeight: 1493,
    imageAlt: "Soft blonde balayage and highlights by Tyra Hair Studio in Cypress, Texas",
    paragraphs: [
      "Balayage and highlights are customized services, not one fixed pattern. Placement can concentrate brightness around the face, build dimension through the interior, or create a fuller blonde result. The right approach depends on your starting color, previous chemical services, haircut, density, and how you style your hair most days.",
      "At Tyra Hair Studio, the consultation covers the amount of contrast you like, your preferred tone, how often you want to refresh, and whether your inspiration can be reached safely in one appointment. Toner and finishing services are used as needed to refine warmth, softness, and shine.",
      "Balayage often gives a softer grow-out, while traditional highlights can create brightness closer to the root. Some goals use both techniques. If the hair has box color, banding, or previous bleach, a strand test or staged plan may be the most responsible next step."
    ],
    bullets: [
      "Balayage or ombré from $220+",
      "Partial highlights from $120+",
      "Full highlights from $180+",
      "Bleach and tone from $200+",
      "Toner refresh from $65+"
    ],
    priceLabel: "Blonding starting prices",
    price: "$120+ partial · $180+ full · $220+ balayage",
    offers: [
      { name: "Partial highlights", price: "120" },
      { name: "Full highlights", price: "180" },
      { name: "Balayage or ombré", price: "220" }
    ],
    faqs: [
      ["Is balayage lower maintenance than highlights?", "It can be. Balayage is often placed for a softer grow-out, but maintenance still depends on the contrast, tone, gray coverage needs, and how bright you want to stay."],
      ["Can dark or previously colored hair become blonde in one visit?", "Sometimes a visible change is possible, but the safest result may require more than one session. A consultation helps set a realistic target based on color history and condition."],
      ["How much does balayage cost at Tyra Hair Studio?", "Balayage and ombré start at $220. Final pricing depends on length, density, starting color, product, timing, and the chosen finish."]
    ]
  },
  {
    slug: "haircuts-cypress-tx",
    serviceName: "Haircuts",
    title: "Haircuts in Cypress, TX | Tyra Hair Studio",
    description: "Haircuts in Cypress, TX for women, men, boys, and girls, plus wash, cut and style, bang trims, beard trims, and personalized haircut consultations.",
    eyebrow: "Haircuts · Cypress, Texas",
    h1: "Haircuts in Cypress, TX",
    intro: "A shape that works with your texture, routine, movement, and the way you want to style at home.",
    h2: "A thoughtful cut for the hair you actually wear.",
    image: "/images/services/hair-cuts.webp?v=professional-v2",
    imageWidth: 1122,
    imageHeight: 1402,
    imageAlt: "Professional haircut service at Tyra Hair Studio in Cypress, Texas",
    paragraphs: [
      "A strong haircut starts before the first cut. At Tyra Hair Studio, the consultation considers your current shape, texture, density, styling habits, and how much time you want to spend on your hair. Reference photos are welcome, and the goal is translated into a shape that suits your actual starting point.",
      "Haircut options include women’s cuts, wash-cut-style appointments, men’s cuts, children’s cuts, bang trims, beard trims, and hair wash services. A wash, cut, and style appointment gives time to see the finished movement and discuss simple styling choices for home.",
      "If your haircut is part of a color transformation, shape and color placement can be planned together. That helps face-framing pieces, layers, and the final finish support one another. Prices are starting points and may vary with length, density, timing, and the requested result."
    ],
    bullets: [
      "Women’s cut from $35+",
      "Wash, cut, and style from $45+",
      "Men’s cut from $20+",
      "Boy’s cut from $18+ and girl’s cut from $30+",
      "Bang or beard trim from $10+"
    ],
    priceLabel: "Haircut starting prices",
    price: "$18+ children · $20+ men · $35+ women",
    offers: [
      { name: "Women’s haircut", price: "35" },
      { name: "Wash, cut and style", price: "45" },
      { name: "Men’s haircut", price: "20" }
    ],
    faqs: [
      ["Should I book a cut only or wash, cut, and style?", "Choose wash, cut, and style when you want the full finished result and styling guidance. A cut-only appointment may suit a straightforward maintenance visit."],
      ["Can I bring haircut inspiration photos?", "Yes. Photos help communicate length, shape, layering, and finish. Your stylist can explain how the reference may translate to your texture, density, and current haircut."],
      ["How often should I schedule a haircut?", "The right interval depends on the shape, length, texture, and how polished you want it to stay. Short or structured cuts usually need earlier maintenance than long, soft shapes."]
    ]
  },
  {
    slug: "head-spa-cypress-tx",
    serviceName: "Head Spa",
    title: "Head Spa in Cypress, TX | Tyra Hair Studio",
    description: "Book a relaxing head spa in Cypress, TX with scalp treatment, deep conditioning, and head massage at Tyra Hair Studio. Service starts at $60.",
    eyebrow: "Head spa · Cypress, Texas",
    h1: "Head Spa in Cypress, TX",
    intro: "A focused scalp-care and conditioning appointment designed to feel calm, restorative, and unhurried.",
    h2: "Scalp care, deep conditioning, and head massage.",
    image: "/images/services/head-spa.webp?v=head-spa-relax-v1",
    imageWidth: 1024,
    imageHeight: 1536,
    imageAlt: "Relaxing head spa service at Tyra Hair Studio in Cypress, Texas",
    paragraphs: [
      "The Tyra Hair Studio head spa combines scalp treatment, deep conditioning, and head massage in one focused service. It is an option for clients who want a relaxing salon visit while giving the scalp and hair a thorough cleanse and conditioning step.",
      "Your stylist can discuss your current scalp feel, wash routine, recent chemical services, and hair condition before beginning. The service is cosmetic and relaxation-focused; persistent irritation, sudden hair loss, or a diagnosed scalp condition should be discussed with an appropriate medical professional.",
      "Head spa starts at $60. Appointment length and final price may vary when paired with other services or adjusted for hair length and density. If you are also planning color, keratin, or another chemical service, mention it when booking so the sequence can be planned appropriately."
    ],
    bullets: [
      "Scalp-focused cleansing and treatment",
      "Deep conditioning for the hair",
      "Relaxing head massage",
      "Consultation about current hair and scalp routine",
      "Available from $60+"
    ],
    priceLabel: "Head spa starting price",
    price: "$60+",
    offers: [{ name: "Head spa", price: "60" }],
    faqs: [
      ["What is included in the Tyra Hair Studio head spa?", "The listed service includes scalp treatment, deep conditioning, and head massage. Ask the salon about timing or combining it with another appointment."],
      ["Is a head spa a medical scalp treatment?", "No. This is a cosmetic and relaxation service. Ongoing irritation, hair loss, or scalp conditions should be evaluated by an appropriate healthcare professional."],
      ["Can I book a head spa with another hair service?", "Contact the studio before booking combined services so the timing and order can be planned around your hair and the other service selected."]
    ]
  },
  {
    slug: "keratin-treatment-cypress-tx",
    serviceName: "Keratin & Hair Treatments",
    title: "Keratin & Hair Treatments in Cypress, TX | Tyra Hair Studio",
    description: "Keratin treatment, Brazilian Blowout, Olaplex, and shine glossing treatments in Cypress, TX with consultation-led recommendations at Tyra Hair Studio.",
    eyebrow: "Hair treatments · Cypress, Texas",
    h1: "Keratin & Hair Treatments in Cypress, TX",
    intro: "Choose a smoothing, strengthening, or shine service based on your hair condition and the finish you want.",
    h2: "Treatments selected for your hair and your goal.",
    image: "/images/services/treatments.webp",
    imageWidth: 720,
    imageHeight: 878,
    imageAlt: "Keratin and conditioning hair treatment at Tyra Hair Studio in Cypress, Texas",
    paragraphs: [
      "Tyra Hair Studio offers several treatment options because shine, smoothing, and strengthening are different goals. A brief consultation helps identify whether a glossing service, Olaplex treatment, keratin treatment, or Brazilian Blowout better matches your current hair and desired finish.",
      "Keratin and Brazilian Blowout services are often chosen for a smoother, more manageable result. Olaplex can be selected as a focused treatment, while shiny glossing is a lighter option when the goal is polish and reflection. Your stylist will consider recent color, chemical history, texture, density, and home routine before recommending a service.",
      "Treatment prices are starting points. Length, density, product use, timing, and combining a treatment with another appointment can change the final total. Ask about aftercare before leaving, since shampoo choice, heat habits, and the timing of your next service can affect how the finish wears."
    ],
    bullets: [
      "Shiny glossing treatment from $35+",
      "Olaplex treatment from $35+",
      "Keratin treatment from $180+",
      "Brazilian Blowout treatment from $220+",
      "Consultation helps match the service to your goal"
    ],
    priceLabel: "Treatment starting prices",
    price: "$35+ gloss/Olaplex · $180+ keratin · $220+ Brazilian Blowout",
    offers: [
      { name: "Olaplex treatment", price: "35" },
      { name: "Keratin treatment", price: "180" },
      { name: "Brazilian Blowout treatment", price: "220" }
    ],
    faqs: [
      ["What is the difference between keratin and Olaplex?", "They are selected for different goals. Keratin services are generally chosen for smoothing and manageability, while Olaplex is offered as a focused treatment. Your stylist can recommend the better fit after assessing your hair."],
      ["How much is a keratin treatment at Tyra Hair Studio?", "Keratin treatment starts at $180. Final pricing can vary with hair length, density, product, time, and the result planned during consultation."],
      ["Can I have a treatment and color in the same appointment?", "Some services can be paired, but the correct order and timing depend on the products and your hair history. Mention both goals when booking so the salon can plan the appointment."]
    ]
  }
];

function commonHead({ title, description, canonical, schema, robots = "index, follow, max-image-preview:large" }) {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="en-US" href="${canonical}">
    <link rel="alternate" hreflang="x-default" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="en_US">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:site_name" content="Tyra Hair Studio">
    <meta property="og:image" content="${origin}/assets/social-preview.jpg?v=20260704">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Tyra Hair Studio in Cypress, Texas">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${origin}/assets/social-preview.jpg?v=20260704">
    <meta name="theme-color" content="#17120f">
    <link rel="icon" type="image/png" href="/assets/tyra-logo.png">
    <link rel="stylesheet" href="/styles.css?v=seo-local-v1">
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function header(active = "") {
  const nav = [
    ["Home", "/", "home"],
    ["About us", "/about/", "about"],
    ["Services", "/service/", "services"],
    ["Gallery", "/gallery/", "gallery"],
    ["Contact us", "/contact/", "contact"]
  ];
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header" data-header>
      <div class="top-ribbon" aria-label="Studio quick information"><span data-top-address>9212 Fry Rd #160, Cypress, TX 77433</span></div>
      <div class="main-nav-row">
        <a class="brand-mark" href="/" aria-label="Tyra Hair Studio home"><img class="brand-logo" src="/assets/tyra-logo-192.webp" srcset="/assets/tyra-logo-96.webp 96w, /assets/tyra-logo-192.webp 192w" sizes="86px" width="192" height="199" alt=""></a>
        <nav class="nav-links" id="main-navigation" data-nav-links aria-label="Main navigation">
          ${nav.map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`).join("\n          ")}
          <a data-booking href="${bookingUrl}" target="_blank" rel="noopener noreferrer">Booking</a>
        </nav>
        <a class="mobile-booking" data-booking href="${bookingUrl}" target="_blank" rel="noopener noreferrer">Booking</a>
        <button class="menu-toggle" type="button" data-menu-toggle aria-controls="main-navigation" aria-expanded="false" aria-label="Open menu"><span></span><span></span><span></span></button>
      </div>
    </header>`;
}

function footer() {
  const hours = site.hours.map(({ day, time }) => `<div><dt>${escapeHtml(day)}</dt><dd>${escapeHtml(time)}</dd></div>`).join("");
  return `
    <div class="floating-actions" aria-label="Quick actions">
      <a class="float-pill" href="tel:3466667580" aria-label="Call Tyra Hair Studio"><span class="float-label">Call now</span><span>(346) 666-7580</span></a>
      <a class="float-pill" data-booking href="${bookingUrl}" target="_blank" rel="noopener noreferrer" aria-label="Book an appointment"><span class="float-label">Reserve</span><span>Booking</span></a>
      <a class="float-top" href="#main" aria-label="Back to top">&uarr;</a>
    </div>
    <footer class="global-footer visit-section" id="contact" aria-labelledby="visit-title">
      <div class="visit-inner">
        <div class="visit-info-grid">
          <div class="social-panel"><h2 id="visit-title">Tyra Hair Studio</h2><p>Healthy hair meets effortless elegance in Cypress, Texas.</p><div class="social-links" aria-label="Social links"><a class="social-link facebook" href="${escapeHtml(site.facebook)}" aria-label="Tyra Hair Studio on Facebook">f</a><a class="social-link email" href="mailto:${escapeHtml(site.email)}" aria-label="Email Tyra Hair Studio">@</a></div></div>
          <div class="footer-contact-panel"><h2>Contact us</h2><div class="contact-method"><span aria-hidden="true">&#8962;</span><div><strong>Address:</strong><p>9212 Fry Rd #160, Cypress, TX 77433</p></div></div><div class="contact-method"><span aria-hidden="true">&#9742;</span><div><strong>Phone:</strong><a href="tel:3466667580">(346) 666-7580</a></div></div><div class="contact-method"><span aria-hidden="true">&#9993;</span><div><strong>Email:</strong><a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a></div></div></div>
          <div class="footer-hours-panel"><h2>Open Hours</h2><dl>${hours}</dl></div>
        </div>
        <div class="location-block"><h2>Location</h2><p><a class="button primary" href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Get directions to the studio</a></p></div>
        <div class="footer-credit"><p><span>Copyright &copy; ${new Date().getFullYear()} <strong>Tyra Hair Studio</strong>. All rights reserved.</span><span>9212 Fry Rd #160, Cypress, TX 77433</span></p></div>
      </div>
    </footer>
    <script src="/app-head-spa-relax-v1.js?v=booking-direct-v1" type="module"></script>`;
}

function bookingCta() {
  return `<section class="booking-attractor-section" aria-label="Book an appointment"><a class="booking-attractor-button" data-booking data-rose-attractor href="${bookingUrl}" target="_blank" rel="noopener noreferrer">BOOKING NOW</a></section>`;
}

function relatedServices(currentSlug) {
  return landingPages.filter((page) => page.slug !== currentSlug).slice(0, 4).map((page) => `<a href="/${page.slug}/"><strong>${escapeHtml(page.serviceName)}</strong><span>${escapeHtml(page.intro)}</span></a>`).join("");
}

function serviceSchema(page) {
  const pageUrl = `${origin}/${page.slug}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      salonSchema,
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: page.serviceName,
        description: page.description,
        url: pageUrl,
        areaServed: { "@type": "City", name: "Cypress, Texas" },
        provider: { "@id": `${origin}/#salon` },
        offers: page.offers.map((offer) => ({
          "@type": "Offer",
          name: offer.name,
          price: offer.price,
          priceCurrency: "USD",
          url: pageUrl,
          availability: "https://schema.org/InStock"
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer }
        }))
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Services", path: "/service/" },
        { name: page.serviceName, path: `/${page.slug}/` }
      ])
    ]
  };
}

function servicePageHtml(page) {
  const canonical = `${origin}/${page.slug}/`;
  return `<!doctype html>
<html lang="en-US">
  <head>${commonHead({ title: page.title, description: page.description, canonical, schema: serviceSchema(page) })}
  </head>
  <body>
${header("services")}
    <main id="main">
      <section class="page-hero" id="top" aria-labelledby="page-title"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1 id="page-title">${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.intro)}</p></section>
      <section class="section seo-content-section" aria-labelledby="service-detail-title">
        <div class="seo-content-grid">
          <article class="seo-copy">
            <p class="section-kicker">Tyra Hair Studio</p>
            <h2 id="service-detail-title">${escapeHtml(page.h2)}</h2>
            ${page.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n            ")}
            <h3>Services and starting prices</h3>
            <ul>${page.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            <div class="seo-price-box"><strong>${escapeHtml(page.priceLabel)}</strong><span>${escapeHtml(page.price)}</span></div>
            <p><a class="button primary" href="${bookingUrl}" target="_blank" rel="noopener noreferrer">Book an appointment</a></p>
          </article>
          <figure class="seo-service-image"><img src="${page.image}" alt="${escapeHtml(page.imageAlt)}" width="${page.imageWidth}" height="${page.imageHeight}" loading="eager" decoding="async"></figure>
        </div>
      </section>
      <section class="section seo-faq-section" aria-labelledby="faq-title"><p class="section-kicker">Before you book</p><h2 id="faq-title">Frequently asked questions</h2><div class="seo-faq-list">${page.faqs.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</div></section>
      <section class="section seo-paths" aria-labelledby="related-title"><div class="section-heading compact"><div><p class="section-kicker">Explore more</p><h2 id="related-title">Related hair services.</h2></div><p>Compare options, starting prices, and what to expect before choosing your appointment.</p></div><div class="seo-link-grid">${relatedServices(page.slug)}</div></section>
      ${bookingCta()}
    </main>
${footer()}
  </body>
</html>\n`;
}

for (const page of landingPages) {
  const directory = path.join(publicDir, page.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), servicePageHtml(page), "utf8");
}

const formatDate = (value) => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));

const journalSeo = {
  "keep-blonde-hair-bright": {
    title: "Keep Blonde Hair Bright | Tyra Hair Studio",
    description: "Learn a simple care routine for keeping blonde hair bright, hydrated, and polished between salon appointments without overusing purple shampoo."
  },
  "color-correction-consultation": {
    title: "Color Correction Consultation | Tyra Hair Studio",
    description: "Learn what happens during a hair color correction consultation, from color history and strand testing to realistic timing and a safer service plan."
  },
  "gloss-toner-glaze": {
    title: "Gloss vs. Toner vs. Glaze | Tyra Hair Studio",
    description: "Understand the difference between hair gloss, toner, and glaze so you can discuss the right tone and shine refresh for your current color and goal."
  }
};

function journalPageHtml(post) {
  const canonical = `${origin}/journal/${post.slug}/`;
  const seo = journalSeo[post.slug] || { title: `${post.title} | Tyra Hair Studio`, description: post.excerpt };
  const description = seo.description;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      salonSchema,
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        headline: post.title,
        description,
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: canonical,
        image: `${origin}/assets/social-preview.jpg?v=20260704`,
        author: { "@id": `${origin}/#salon` },
        publisher: { "@id": `${origin}/#salon` },
        articleSection: post.category,
        inLanguage: "en-US"
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Journal", path: "/#journal" },
        { name: post.title, path: `/journal/${post.slug}/` }
      ])
    ]
  };
  return `<!doctype html>
<html lang="en-US">
  <head>${commonHead({ title: seo.title, description, canonical, schema })}
  </head>
  <body>
${header("")}
    <main id="main">
      <section class="page-hero" id="top" aria-labelledby="page-title"><p class="eyebrow">Hair Journal · ${escapeHtml(post.category)}</p><h1 id="page-title">${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p></section>
      <article class="section journal-article"><div class="journal-copy"><p class="journal-meta"><time datetime="${post.date}">${formatDate(post.date)}</time> · Tyra Hair Studio</p>${post.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n          ")}<p><a class="button primary" href="/service/">Explore salon services</a></p></div></article>
      ${bookingCta()}
    </main>
${footer()}
  </body>
</html>\n`;
}

for (const post of blog.posts) {
  const directory = path.join(publicDir, "journal", post.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), journalPageHtml(post), "utf8");
}

const sitemapPaths = [
  ...existingPages.map((page) => ({ path: page.path, lastmod: today, priority: page.path === "/" ? "1.0" : "0.8" })),
  ...landingPages.map((page) => ({ path: `/${page.slug}/`, lastmod: today, priority: "0.9" })),
  ...blog.posts.map((post) => ({ path: `/journal/${post.slug}/`, lastmod: post.date, priority: "0.6" }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((item) => `  <url>\n    <loc>${origin}${item.path}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <changefreq>${item.path.startsWith("/journal/") ? "monthly" : "weekly"}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`).join("\n")}
</urlset>\n`;

await writeFile(path.join(publicDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /tyraadmin/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`, "utf8");

const notFound = `<!doctype html>
<html lang="en-US">
  <head>${commonHead({
    title: "Page Not Found | Tyra Hair Studio",
    description: "The page you requested could not be found.",
    canonical: `${origin}/404.html`,
    schema: { "@context": "https://schema.org", "@type": "WebPage", name: "Page Not Found" },
    robots: "noindex, follow"
  })}
  </head>
  <body>
${header("")}
    <main id="main" class="not-found-panel"><p class="eyebrow">Page not found</p><h1>404</h1><p>The page may have moved or the address may be incorrect. Return to the studio homepage or browse our hair services.</p><p><a class="button primary" href="/">Go to homepage</a> <a class="button ghost" href="/service/">View services</a></p></main>
${footer()}
  </body>
</html>\n`;

await writeFile(path.join(publicDir, "404.html"), notFound, "utf8");

console.log(`SEO build complete: ${existingPages.length} core pages, ${landingPages.length} service pages, ${blog.posts.length} journal pages.`);
