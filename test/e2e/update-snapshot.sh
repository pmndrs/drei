#!/bin/sh
set -e

# Script to generate new test snapshot images with version-aware naming
# This should be run when three.js version is updated in package.json

# Ensure we're in the test/e2e directory
cd "$(dirname "$0")"

# Extract three.js minimum version from package.json peerDependencies
get_three_version() {
  local version=$(node -e "const pkg = require('../../package.json'); const peerDep = pkg.peerDependencies?.three || ''; const match = peerDep.match(/>=?([0-9]+\.[0-9]+)/); if (match) { const parts = match[1].split('.'); console.log(parts[1]); } else { console.error('Could not parse three.js version from peerDependencies'); process.exit(1); }")
  echo "$version"
}

THREE_VERSION=$(get_three_version)
THREE_VERSION_FULL="0.${THREE_VERSION}"

# Temporarily disable trace mode for clean output (if enabled)
set +x 2>/dev/null || true
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Updating Test Snapshot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Three.js version from package.json: ${THREE_VERSION_FULL}"
echo "  Expected snapshot name: should-match-previous-one-1-${THREE_VERSION}-linux.png"
echo "  (Playwright automatically adds -linux platform suffix)"
echo ""
set -x 2>/dev/null || true

# Build the package first (required for e2e tests)
echo "🔨 Building package..."
(cd ../.. && yarn build)

# Set up minimal test environment (only need one app for snapshot generation)
PORT=5188
DIST=../../dist
tmp=$(mktemp -d)
appname=viteapp
appdir="$tmp/$appname"

# Build the package
(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

# Create vite app (use flags to skip all prompts)
echo "📦 Creating test app..."
(cd $tmp; npm create vite@latest $appname -- --template react-ts --no-rolldown --no-interactive)

# Install drei and three.js
echo "📥 Installing dependencies..."
(cd $appdir; npm i --no-fund --no-audit --silent; npm i $TGZ --no-fund --no-audit --silent)
(cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

# Copy App.tsx
cp App.tsx $appdir/src/App.tsx

# Start the app in background
echo "🚀 Starting test server..."
(cd $appdir; npm run build; npm run preview -- --host --port $PORT &)
APP_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server..."
wait_for_server() {
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "⚠️  Server didn't start in time"
  return 1
}
wait_for_server

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up..."
  kill $APP_PID 2>/dev/null || true
  kill -9 $(lsof -ti:$PORT) 2>/dev/null || true
  rm -rf $tmp
}
trap cleanup EXIT INT TERM HUP

# Run snapshot test with update flag
echo "📸 Generating snapshot..."
npx playwright test --update-snapshots snapshot.test.ts || true

# Explicit cleanup (trap handles on exit, but ensure cleanup happens)
cleanup

# Check if snapshot was generated and rename if needed
SNAPSHOT_DIR="snapshot.test.ts-snapshots"
# Playwright adds -linux suffix automatically, so the actual filename will have it
EXPECTED_NAME="should-match-previous-one-1-${THREE_VERSION}-linux.png"

if [ -d "$SNAPSHOT_DIR" ]; then
  # Find the generated snapshot file (Playwright adds -linux suffix automatically)
  # Look for files matching the pattern
  GENERATED_FILE=$(find "$SNAPSHOT_DIR" -name "should-match-previous-one-1-${THREE_VERSION}-linux.png" | head -n 1)
  
  if [ -n "$GENERATED_FILE" ]; then
    FINAL_PATH="$SNAPSHOT_DIR/$EXPECTED_NAME"
    
    # If the file doesn't already have the correct name, rename it
    if [ "$GENERATED_FILE" != "$FINAL_PATH" ]; then
      echo "📝 Renaming snapshot to include version..."
      mv "$GENERATED_FILE" "$FINAL_PATH"
      echo "  ✅ Renamed: $(basename "$GENERATED_FILE") → $EXPECTED_NAME"
    else
      echo "  ✅ Snapshot already has correct name: $EXPECTED_NAME"
    fi
    
    # Remove any old snapshots with different versions
    echo "🧹 Cleaning up old snapshots..."
    find "$SNAPSHOT_DIR" -name "should-match-previous-one-1-linux-*.png" ! -name "$EXPECTED_NAME" -delete
    
    # Temporarily disable trace mode for clean output (if enabled)
    set +x 2>/dev/null || true
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Snapshot update complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  📁 Snapshot location: $SNAPSHOT_DIR/$EXPECTED_NAME"
    echo ""
    echo "  Next steps:"
    echo "  1. Review the generated snapshot to ensure it looks correct"
    echo "  2. Commit the updated snapshot file"
    echo "  3. Run 'yarn test' to verify tests pass"
    echo ""
    set -x 2>/dev/null || true
  else
    echo "⚠️  Warning: Could not find generated snapshot file"
    echo "   Check $SNAPSHOT_DIR/ for generated files"
  fi
else
  echo "⚠️  Warning: Snapshot directory not found: $SNAPSHOT_DIR"
fi

