#!/bin/bash
set -e  # Exit immediately on error

echo "Starting build..."

# 0. Ensure _processed folder exists
PROCESSED_DIR="content/uploads/_processed"
if [ ! -d "$PROCESSED_DIR" ]; then
  echo "Creating _processed folder for compressed images..."
  mkdir -p "$PROCESSED_DIR"
fi

# 1. Clean old compressed images
echo "Cleaning old compressed images from $PROCESSED_DIR..."
find "$PROCESSED_DIR" -type f -name "*.webp" -exec rm -f {} \;

# 2. Compress images
if [ -f ./build_scripts/compress-images.sh ]; then
  echo "Compressing images from content/uploads..."
  bash ./build_scripts/compress-images.sh
else
  echo "Warning: compress-images.sh not found, skipping compression."
fi

# 3. Build Eleventy site
echo "Building Eleventy site..."
npx @11ty/eleventy

# 4. Build complete
echo "Build complete!"
echo "Site is output to _site/"