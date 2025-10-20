#!/bin/bash
set -e

echo "Starting build..."

PROCESSED_DIR="content/uploads/_processed"
if [ ! -d "$PROCESSED_DIR" ]; then
  echo "Creating _processed folder for compressed images..."
  mkdir -p "$PROCESSED_DIR"
fi

echo "Cleaning old compressed images from $PROCESSED_DIR..."
find "$PROCESSED_DIR" -type f -name "*.webp" -exec rm -f {} \;

if [ -f ./build_scripts/compress-images.js ]; then
  echo "Compressing images from content/uploads..."
  node ./build_scripts/compress-images.js
else
  echo "Warning: compress-images.js not found, skipping compression."
fi

echo "Building Eleventy site..."
npx @11ty/eleventy

echo "Build complete!"
echo "Site is output to _site/"
