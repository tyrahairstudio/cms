import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const sourceDir = "tmp/drive-gallery";
const outputDir = "public/images/gallery";
const contentFile = "public/content/gallery.json";

const featuredNames = new Set([
  "IMG_4786.PNG",
  "IMG_4787.PNG",
  "IMG_6465.HEIC",
  "IMG_7902.HEIC",
  "IMG_9580.HEIC",
  "IMG_0016.HEIC"
]);

const curatedOutNames = new Set([
  "IMG_0565.HEIC",
  "IMG_0837.HEIC",
  "IMG_0955.JPG",
  "IMG_4950.JPG",
  "IMG_4951.JPG",
  "IMG_4966.JPG",
  "IMG_4969.JPG",
  "IMG_5133.JPG",
  "IMG_5704.HEIC",
  "IMG_5750.HEIC",
  "IMG_5971.JPG",
  "IMG_6126.HEIC",
  "IMG_6464.HEIC",
  "IMG_6466.jpg",
  "IMG_6474.HEIC",
  "IMG_7257.HEIC",
  "IMG_7499.HEIC",
  "IMG_7500.HEIC",
  "IMG_7903.HEIC",
  "IMG_8245.HEIC",
  "IMG_9640.HEIC"
]);

const transformationNames = new Set([
  "IMG_4920.PNG",
  "IMG_4924.PNG",
  "IMG_4949.JPG",
  "IMG_5673.JPG",
  "IMG_8444.JPG"
]);

const vividNames = new Set([
  "IMG_0016.HEIC",
  "IMG_0564.HEIC",
  "IMG_0742.HEIC",
  "IMG_3142.JPG",
  "IMG_4967.JPG",
  "IMG_6125.HEIC",
  "IMG_9531.HEIC",
  "IMG_9328.HEIC"
]);

const blondeNames = new Set([
  "IMG_0780.HEIC",
  "IMG_4183.HEIC",
  "IMG_4791.PNG",
  "IMG_4973.JPG",
  "IMG_5540.HEIC",
  "IMG_5848.HEIC",
  "IMG_6309.HEIC",
  "IMG_7312.HEIC",
  "IMG_7902.HEIC",
  "IMG_7903.HEIC",
  "IMG_9580.HEIC",
  "IMG_9636.HEIC",
  "IMG_9771.HEIC"
]);

const ashBlendNames = new Set([
  "IMG_0466.HEIC",
  "IMG_0780.HEIC",
  "IMG_0836.HEIC",
  "IMG_4784.PNG",
  "IMG_4786.PNG",
  "IMG_4787.PNG",
  "IMG_4789.PNG",
  "IMG_4963.JPG",
  "IMG_4968.JPG",
  "IMG_5059.HEIC",
  "IMG_5515.HEIC",
  "IMG_5544.HEIC",
  "IMG_5649.HEIC",
  "IMG_5749.HEIC",
  "IMG_5752.HEIC",
  "IMG_6465.HEIC",
  "IMG_6467.jpg",
  "IMG_6473.HEIC",
  "IMG_6532.HEIC",
  "IMG_6677.HEIC",
  "IMG_7117.HEIC",
  "IMG_7254.HEIC",
  "IMG_7284.HEIC",
  "IMG_7498.HEIC",
  "IMG_8244.HEIC",
  "IMG_8481.HEIC",
  "IMG_8589.HEIC",
  "IMG_8780.HEIC",
  "IMG_9639.HEIC",
  "IMG_9906.HEIC"
]);

const brunetteNames = new Set([
  "IMG_0016.HEIC",
  "IMG_0083.HEIC",
  "IMG_0564.HEIC",
  "IMG_0652.HEIC",
  "IMG_0742.HEIC",
  "IMG_1384.HEIC",
  "IMG_4961.JPG",
  "IMG_4964.JPG",
  "IMG_6424.HEIC",
  "IMG_7275.HEIC",
  "IMG_8020.HEIC",
  "IMG_9501.HEIC",
  "IMG_9531.HEIC",
  "IMG_9811.HEIC"
]);

const shortDetailNames = new Set([
  "IMG_6532.HEIC",
  "IMG_8589.HEIC",
  "IMG_9639.HEIC",
  "IMG_9906.HEIC"
]);

const collectionSpecs = [
  {
    id: "ash-gray-blending",
    title: "Ash blonde & gray blending",
    kicker: "Cool tones",
    description: "Smoky blonde, silver ribbons, and soft gray blending with movement.",
    cover: "IMG_6465.HEIC",
    names: ashBlendNames
  },
  {
    id: "bright-blondes",
    title: "Bright blondes & balayage",
    kicker: "Blonding",
    description: "Creamy blondes, ribbon highlights, and dimensional balayage finishes.",
    cover: "IMG_7902.HEIC",
    names: blondeNames
  },
  {
    id: "brunette-copper",
    title: "Brunette, copper & gloss",
    kicker: "Warm depth",
    description: "Lived-in brunette, copper melts, chocolate waves, and polished shine.",
    cover: "IMG_0016.HEIC",
    names: brunetteNames
  },
  {
    id: "before-after",
    title: "Before & after transformations",
    kicker: "Stories",
    description: "Side-by-side corrections, lifts, and color changes with clear results.",
    cover: "IMG_4924.PNG",
    names: transformationNames
  },
  {
    id: "vivid-color",
    title: "Vivid color moments",
    kicker: "Creative color",
    description: "Red, pink, copper-orange, purple, blue, and lavender work for bolder salon moments.",
    cover: "IMG_4967.JPG",
    names: vividNames
  },
  {
    id: "short-detail",
    title: "Bobs, cuts & detail shots",
    kicker: "Shape",
    description: "Short bobs, clean necklines, compact shape, and polished silhouette work.",
    cover: "IMG_8589.HEIC",
    names: shortDetailNames
  }
];

const featuredLabels = new Map([
  ["IMG_4786.PNG", "Silver blonde waves"],
  ["IMG_4787.PNG", "Champagne dimensional waves"],
  ["IMG_6465.HEIC", "Money piece balayage"],
  ["IMG_7902.HEIC", "Creamy ribbon blonde"],
  ["IMG_9580.HEIC", "Soft golden movement"],
  ["IMG_0016.HEIC", "Copper brunette melt"]
]);

const transformationLabels = new Map([
  ["IMG_4920.PNG", "Lift and tone refresh"],
  ["IMG_4924.PNG", "Dark to lavender gloss"],
  ["IMG_4949.JPG", "Face-framing blonde"],
  ["IMG_5673.JPG", "Warm brunette correction"],
  ["IMG_8444.JPG", "Shadow root refresh"]
]);

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (name) =>
  path
    .parse(name)
    .name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const backdropSvg = (width, height) => Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff8ef"/>
        <stop offset="0.45" stop-color="#eadbc8"/>
        <stop offset="1" stop-color="#d8c5ad"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="28%" r="60%">
        <stop offset="0" stop-color="#fffdf8" stop-opacity="0.86"/>
        <stop offset="1" stop-color="#fffdf8" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grain" width="86" height="86" patternUnits="userSpaceOnUse">
        <path d="M0 42H86M42 0V86" stroke="#6f3327" stroke-opacity="0.035" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#silk)"/>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <rect width="100%" height="100%" fill="url(#grain)"/>
    <path d="M${width * 0.11} ${height}C${width * 0.24} ${height * 0.48} ${width * 0.76} ${height * 0.48} ${width * 0.89} ${height}" fill="none" stroke="#fffaf3" stroke-opacity="0.42" stroke-width="${Math.max(2, Math.round(width * 0.008))}"/>
  </svg>
`);

async function listUniqueImages() {
  const files = (await readdir(sourceDir))
    .filter((name) => /\.(heic|jpg|jpeg|png)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const seen = new Map();
  const unique = [];

  for (const name of files) {
    const filePath = path.join(sourceDir, name);
    const hash = crypto.createHash("sha1").update(await readFile(filePath)).digest("hex");
    if (seen.has(hash)) continue;
    if (curatedOutNames.has(name)) continue;
    seen.set(hash, name);
    unique.push({ name, filePath });
  }

  return unique;
}

async function renderImage(input, output, options) {
  let base = sharp(input, { unlimited: true }).rotate();
  if (options.trimMatte) {
    base = base.trim({ background: "#202020", threshold: 16 });
  }
  const resized = await base.resize(options.resize).toBuffer({ resolveWithObject: true });

  if (options.backdrop) {
    await sharp(backdropSvg(resized.info.width, resized.info.height))
      .composite([{ input: resized.data, left: 0, top: 0 }])
      .webp({ quality: options.quality, effort: 6 })
      .toFile(output);
    return;
  }

  await sharp(resized.data)
    .flatten({ background: "#efe4d6" })
    .webp({ quality: options.quality, effort: 6 })
    .toFile(output);
}

function categoryFor(name, meta) {
  if (transformationNames.has(name)) return "Transformation";
  if (vividNames.has(name)) return "Vivid color";
  if (blondeNames.has(name)) return "Blonde work";
  if (meta.width && meta.height && Math.abs(meta.width - meta.height) < 80) return "Detail";
  return "Color work";
}

function labelFor(name, index, category) {
  if (transformationLabels.has(name)) return transformationLabels.get(name);
  if (featuredLabels.has(name)) return featuredLabels.get(name);
  return category;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const sourceImages = await listUniqueImages();
const items = [];
const skipped = [];

for (const [sourceIndex, source] of sourceImages.entries()) {
  try {
    await sharp(source.filePath, { unlimited: true }).rotate().resize({ width: 48 }).webp().toBuffer();
    const meta = await sharp(source.filePath, { unlimited: true }).metadata();
    const id = `gallery-${String(items.length + 1).padStart(3, "0")}-${slugify(source.name)}`;
    const thumb = `/images/gallery/${id}-thumb.webp`;
    const display = `/images/gallery/${id}-display.webp`;
    const large = `/images/gallery/${id}-large.webp`;
    const hasAlpha = Boolean(meta.hasAlpha);

    await renderImage(source.filePath, path.join(outputDir, `${id}-thumb.webp`), {
      backdrop: hasAlpha,
      quality: 58,
      trimMatte: hasAlpha,
      resize: { width: 360, height: 500, fit: "inside", withoutEnlargement: true }
    });

    await renderImage(source.filePath, path.join(outputDir, `${id}-display.webp`), {
      backdrop: hasAlpha,
      quality: 68,
      trimMatte: hasAlpha,
      resize: { width: 760, height: 1040, fit: "inside", withoutEnlargement: true }
    });

    await renderImage(source.filePath, path.join(outputDir, `${id}-large.webp`), {
      backdrop: hasAlpha,
      quality: 74,
      trimMatte: hasAlpha,
      resize: { width: 1120, height: 1500, fit: "inside", withoutEnlargement: true }
    });

    const outputMeta = await sharp(path.join(outputDir, `${id}-display.webp`)).metadata();
    const largeMeta = await sharp(path.join(outputDir, `${id}-large.webp`)).metadata();
    const category = categoryFor(source.name, meta);
    const featuredRank = featuredNames.has(source.name) ? Array.from(featuredNames).indexOf(source.name) + 1 : null;
    const transformationRank = transformationNames.has(source.name)
      ? Array.from(transformationNames).indexOf(source.name) + 1
      : null;

    items.push({
      id,
      label: labelFor(source.name, sourceIndex, category),
      category,
      original: source.name,
      thumb,
      display,
      large,
      width: outputMeta.width,
      height: outputMeta.height,
      largeWidth: largeMeta.width,
      largeHeight: largeMeta.height,
      featuredRank,
      transformationRank,
      backdrop: hasAlpha
    });
  } catch (error) {
    skipped.push({
      name: source.name,
      reason: error.message.split("\n")[0]
    });
  }
}

const featured = items
  .filter((item) => item.featuredRank)
  .sort((a, b) => a.featuredRank - b.featuredRank);

const transformations = items
  .filter((item) => item.transformationRank)
  .sort((a, b) => a.transformationRank - b.transformationRank);

const collections = collectionSpecs
  .map((collection) => {
    const collectionItems = items.filter((item) => collection.names.has(item.original));
    const cover = collectionItems.find((item) => item.original === collection.cover) || collectionItems[0];
    return {
      id: collection.id,
      title: collection.title,
      kicker: collection.kicker,
      description: collection.description,
      count: collectionItems.length,
      cover,
      preview: collectionItems.filter((item) => item.id !== cover?.id).slice(0, 3),
      items: collectionItems
    };
  })
  .filter((collection) => collection.count);

const gallery = {
  title: "Gallery",
  intro: "Real salon work from Tyra Hair Studio: dimensional color, soft blonding, vivid transformations, gloss, cuts, and polished finishes.",
  sourceCount: sourceImages.length,
  itemCount: items.length,
  skippedCount: skipped.length,
  featured,
  transformations,
  collections
};

await writeFile(contentFile, `${JSON.stringify(gallery, null, 2)}\n`);

const outputStats = await Promise.all(
  (await readdir(outputDir)).map(async (name) => (await stat(path.join(outputDir, name))).size)
);
const outputBytes = outputStats.reduce((sum, size) => sum + size, 0);

console.log(`Gallery images: ${items.length}`);
console.log(`Skipped images: ${skipped.length}`);
console.log(`Output size: ${formatBytes(outputBytes)}`);
console.log(escapeXml(contentFile));
