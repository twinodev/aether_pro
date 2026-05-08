#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting builds process..."

# 1. Clean previous builds
echo "🧹 Cleaning dist directory..."
npm run clean || rm -rf dist

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Running Linter
echo "🔍 Running linter..."
npm run lint

# 4. Building application
echo "🏗️ Building for production..."
npm run build

echo "✅ Build completed successfully! Check the /dist folder."
