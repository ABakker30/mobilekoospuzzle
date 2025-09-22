# PBR Assets Directory

This directory contains the assets needed for the PBR (Physically Based Rendering) materials system.

## Directory Structure

### `/hdri/`
HDR environment maps for realistic metal reflections:
- `studio_1k.hdr` - Low-resolution studio lighting (~500KB)
- `studio_4k.hdr` - High-resolution studio lighting (~4MB)

### `/textures/`
Normal maps and surface detail textures:
- `micro_scratches_normal.jpg` - Subtle scratches for gold clearcoat
- `steel_scratches_normal.jpg` - Fine scratches for stainless steel
- `brushed_anisotropy.jpg` - Directional brushing pattern for brushed steel

### `/thumbnails/`
Material preview thumbnails for the settings UI:
- `gold.jpg` - Gold material preview
- `steel.jpg` - Stainless steel material preview
- `brushed_steel.jpg` - Brushed steel material preview

## Asset Requirements

### HDR Environment Maps
- Format: `.hdr` (Radiance HDR)
- Studio lighting setup with neutral background
- Low-res: 1024x512 or 2048x1024 for fast loading
- High-res: 4096x2048 or 8192x4096 for quality

### Normal Maps
- Format: `.jpg` or `.png`
- Resolution: 512x512 or 1024x1024
- Tiling: Seamless repeating patterns
- Encoding: Standard normal map (RGB, tangent space)

### Thumbnails
- Format: `.jpg`
- Resolution: 128x128 or 256x256
- Content: Sphere rendered with the material preset

## Development Notes

For development, placeholder assets can be created or sourced from:
- HDR Haven (hdrihaven.com) for HDR environments
- Texture Haven (texturehaven.com) for surface textures
- Generated procedurally using Blender or similar tools

The asset loading system supports progressive enhancement:
1. Low-res assets load first for immediate use
2. High-res assets load in background for quality upgrade
3. Graceful fallback if high-res assets fail to load
