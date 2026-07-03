import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = "public";

const images = [
  {
    src: "assets/tyra-cover.png",
    widths: [960, 1440, 1717],
    quality: 82
  },
  {
    src: "assets/tyra-logo.png",
    widths: [96, 192],
    quality: 90
  },
  {
    src: "images/studio/tyra-owner-portrait.png",
    widths: [512, 768, 1024],
    quality: 84
  },
  {
    src: "images/studio/tyra-owner-portrait.png",
    fallbackJpeg: "images/studio/tyra-owner-portrait-768.jpg",
    width: 768,
    quality: 86
  },
  ...[
    "images/covers/tyra-cover-01-brunette-waves.jpg",
    "images/covers/tyra-cover-02-champagne-blonde.jpg",
    "images/covers/tyra-cover-03-copper-layers.jpg",
    "images/covers/tyra-cover-04-glossy-black.jpg",
    "images/covers/tyra-cover-05-ash-blonde.jpg",
    "images/covers/cover-01-blonde-waves-back.jpg",
    "images/covers/cover-02-blonde-balayage-side.jpg",
    "images/covers/cover-03-straight-blonde-back.jpg",
    "images/covers/cover-04-dark-brown-waves-back.jpg",
    "images/covers/cover-05-copper-straight-side.jpg",
    "images/covers/cover-06-brunette-balayage-waves.jpg",
    "images/covers/cover-07-light-blonde-waves-back.jpg",
    "images/covers/cover-08-black-purple-ombre-side.jpg"
  ].map((src) => ({
    src,
    widths: [960, 1440, 1920],
    quality: 82
  })),
  ...[
    ["images/hair/01_blonde_waves_back.jpg", 286],
    ["images/hair/02_blonde_balayage_side.jpg", 263],
    ["images/hair/03_straight_blonde_back.jpg", 258],
    ["images/hair/04_dark_brown_waves_back.jpg", 227],
    ["images/hair/05_copper_straight_side.jpg", 288],
    ["images/hair/06_brunette_balayage_waves.jpg", 263],
    ["images/hair/07_light_blonde_waves_back.jpg", 258],
    ["images/hair/08_black_purple_ombre_side.jpg", 220]
  ].map(([src, width]) => ({
    src,
    widths: [width],
    quality: 84
  }))
];

const outputPath = (source, width, extension = "webp") => {
  const parsed = path.parse(source);
  return path.join(publicDir, parsed.dir, `${parsed.name}-${width}.${extension}`);
};

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function writeWebp(image, width) {
  const input = path.join(publicDir, image.src);
  const output = outputPath(image.src, width);
  await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: image.quality, effort: 6 })
    .toFile(output);
  return output;
}

async function writeFallbackJpeg(image) {
  const input = path.join(publicDir, image.src);
  const output = path.join(publicDir, image.fallbackJpeg);
  await sharp(input)
    .rotate()
    .resize({ width: image.width, withoutEnlargement: true })
    .flatten({ background: "#f8f3eb" })
    .jpeg({ quality: image.quality, mozjpeg: true })
    .toFile(output);
  return output;
}

for (const image of images) {
  const outputs = [];
  if (image.fallbackJpeg) {
    outputs.push(await writeFallbackJpeg(image));
  } else {
    for (const width of image.widths) {
      outputs.push(await writeWebp(image, width));
    }
  }

  for (const output of outputs) {
    const size = await stat(output);
    console.log(`${output}: ${formatBytes(size.size)}`);
  }
}
