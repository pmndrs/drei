#!/bin/sh
set -ex

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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Updating Test Snapshot"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Three.js version from package.json: ${THREE_VERSION_FULL}"
echo "  Expected snapshot name: should-match-previous-one-1-linux-${THREE_VERSION}.png"
echo ""

# Build the package first (required for e2e tests)
echo "🔨 Building package..."
(cd ../.. && yarn build)

# Set environment variable to update snapshots
export PLAYWRIGHT_UPDATE_SNAPSHOTS=1

# Run the e2e tests (this will generate new snapshots)
echo "🔄 Running e2e tests with snapshot update enabled..."
./e2e.sh

# Check if snapshot was generated and rename if needed
SNAPSHOT_DIR="snapshot.test.ts-snapshots"
EXPECTED_NAME="should-match-previous-one-1-linux-${THREE_VERSION}.png"

if [ -d "$SNAPSHOT_DIR" ]; then
  # Find the generated snapshot file (Playwright may generate it with a different name initially)
  # Look for files matching the pattern
  GENERATED_FILE=$(find "$SNAPSHOT_DIR" -name "should-match-previous-one-1-linux*.png" | head -n 1)
  
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
  else
    echo "⚠️  Warning: Could not find generated snapshot file"
    echo "   Check $SNAPSHOT_DIR/ for generated files"
  fi
else
  echo "⚠️  Warning: Snapshot directory not found: $SNAPSHOT_DIR"
fi

