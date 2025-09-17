#!/bin/bash

# Find all JPG and PNG images
find projects -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do
    dir=$(dirname "$img")
    filename=$(basename "$img" | sed 's/\.[^.]*$/.webp/')
    output_dir="$dir/_processed"
    output_path="$output_dir/$filename"

    mkdir -p "$output_dir"

    echo "Converting to WebP: $img -> $output_path"

    # Convert to WebP at high quality (85) with near-lossless compression for PNGs
    if [[ "$img" =~ \.png$ ]]; then
        cwebp -q 85 -near_lossless 60 "$img" -o "$output_path"
    else
        cwebp -q 85 "$img" -o "$output_path"
    fi
done

echo "✅ Conversion complete! Images saved in '_processed' subfolders."