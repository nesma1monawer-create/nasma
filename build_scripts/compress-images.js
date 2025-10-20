// build_scripts/compress-images.js
import fs from "fs";
import path from "path";
import { globby } from "globby";
import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";

const UPLOADS_DIR = "content/uploads";

(async () => {
  console.log(`🔍 Searching for images in ${UPLOADS_DIR}...`);

  // Find all JPG, JPEG, and PNG images, excluding _processed folders
  const files = await globby([
    `${UPLOADS_DIR}/**/*.{jpg,jpeg,png}`,
    `!${UPLOADS_DIR}/**/_processed/**`,
  ]);

  if (files.length === 0) {
    console.log("No images found to convert.");
    process.exit(0);
  }

  console.log(`Found ${files.length} images. Checking for changes...`);

  let convertedCount = 0;
  for (const file of files) {
    const dir = path.dirname(file);
    const filename = path.basename(file).replace(/\.[^.]+$/, ".webp");
    const outputDir = path.join(dir, "_processed");
    const outputPath = path.join(outputDir, filename);

    await fs.promises.mkdir(outputDir, { recursive: true });

    // Skip conversion if already up-to-date
    let skip = false;
    try {
      const [srcStat, outStat] = await Promise.all([
        fs.promises.stat(file),
        fs.promises.stat(outputPath),
      ]);
      if (outStat.mtimeMs >= srcStat.mtimeMs) {
        skip = true;
      }
    } catch {
      // output doesn't exist — convert
    }

    if (skip) {
      console.log(`⏩ Skipping ${file} (already up to date)`);
      continue;
    }

    try {
      await imagemin([file], {
        destination: outputDir,
        plugins: [
          imageminWebp({
            quality: 85,
            nearLossless: file.endsWith(".png"),
          }),
        ],
      });
      convertedCount++;
      console.log(`✅ Converted ${file} -> ${outputPath}`);
    } catch (err) {
      console.error(`❌ Error converting ${file}:`, err.message);
    }
  }

  // 🧹 Remove stale webp files in _processed that no longer have originals
  console.log("🧹 Checking for stale _processed images...");
  const processedFiles = await globby([
    `${UPLOADS_DIR}/**/_processed/*.webp`,
  ]);

  let deletedCount = 0;
  for (const webp of processedFiles) {
    const original = webp
      .replace("/_processed/", "/")
      .replace(/\.webp$/, path.extname(webp).replace(".webp", ""));
    const baseOriginal = original.replace(/_processed\//, "");

    const exists = await fs.promises
      .access(baseOriginal)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      await fs.promises.unlink(webp);
      deletedCount++;
      console.log(`🗑️ Deleted stale file: ${webp}`);
    }
  }

  console.log(`🎉 Done! Converted ${convertedCount} new images, deleted ${deletedCount} stale ones.`);
})();
