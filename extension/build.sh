#!/bin/bash
# Build script for the Haman Chrome Extension

set -e

EXTENSION_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$EXTENSION_DIR/dist"

echo "🔨 Building Haman Chrome Extension..."

# Clean dist directory
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Create directory structure in dist
mkdir -p "$DIST_DIR/lib"
mkdir -p "$DIST_DIR/background"
mkdir -p "$DIST_DIR/content"
mkdir -p "$DIST_DIR/popup"
mkdir -p "$DIST_DIR/options"
mkdir -p "$DIST_DIR/icons"

# Copy static files
echo "📋 Copying files..."
cp "$EXTENSION_DIR/manifest.json" "$DIST_DIR/"

# Copy popup files
cp "$EXTENSION_DIR/popup/popup.html" "$DIST_DIR/popup/"
cp "$EXTENSION_DIR/popup/popup.css" "$DIST_DIR/popup/"
cp "$EXTENSION_DIR/popup/popup.js" "$DIST_DIR/popup/"

# Copy options files
cp "$EXTENSION_DIR/options/options.html" "$DIST_DIR/options/"
cp "$EXTENSION_DIR/options/options.css" "$DIST_DIR/options/"
cp "$EXTENSION_DIR/options/options.js" "$DIST_DIR/options/"

# Copy background worker
cp "$EXTENSION_DIR/background/background.js" "$DIST_DIR/background/"

# Copy content script
cp "$EXTENSION_DIR/content/content.js" "$DIST_DIR/content/"

# Copy lib files
cp "$EXTENSION_DIR/lib/"*.js "$DIST_DIR/lib/" 2>/dev/null || true

# Copy icons
cp "$EXTENSION_DIR/icons/"*.png "$DIST_DIR/icons/" 2>/dev/null || true

echo "✅ Build complete! Extension is in $DIST_DIR"
echo ""
echo "To load the extension in Chrome:"
echo "1. Open chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the '$DIST_DIR' directory"
