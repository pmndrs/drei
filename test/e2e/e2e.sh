#!/bin/sh
set -ex

PORT=5188
export PORT
DIST=../../dist
tmp=$(mktemp -d)
TEST_FAILED=0

# Output directories (relative to test/e2e, will be preserved)
REPORT_DIR="playwright-report"
RESULTS_DIR="test-results"

# Ensure we're in the test/e2e directory
cd "$(dirname "$0")"

# Extract three.js minimum version from package.json peerDependencies
# Parses ">=0.159" to "0.159" and then extracts "159"
get_three_version() {
  local version=$(node -e "const pkg = require('../../package.json'); const peerDep = pkg.peerDependencies?.three || ''; const match = peerDep.match(/>=?([0-9]+\.[0-9]+)/); if (match) { const parts = match[1].split('.'); console.log(parts[1]); } else { console.error('Could not parse three.js version from peerDependencies'); process.exit(1); }")
  echo "$version"
}

# Allow CLI argument: "./e2e.sh 181" or "./e2e.sh 0.181"
if [ -n "$1" ]; then
  if echo "$1" | grep -q '^0\.'; then
    THREE_VERSION_FULL="$1"
    THREE_VERSION=$(echo "$1" | sed 's/^0\.//')
  else
    THREE_VERSION="$1"
    THREE_VERSION_FULL="0.$1"
  fi
  set +x
  echo "📦 Using three.js version: ${THREE_VERSION_FULL} (from command-line argument)"
else
  THREE_VERSION=$(get_three_version)
  THREE_VERSION_FULL="0.${THREE_VERSION}"
  set +x
  echo "📦 Using three.js version: ${THREE_VERSION_FULL} (extracted from package.json peerDependencies)"
fi
export THREE_VERSION
# Ensure browsers and system dependencies are installed
echo "🔍 Ensuring Playwright browsers are installed..."
set -x
npx playwright install chromium 2>&1 | grep -v "is already installed" || true

# Try to install system dependencies if needed
# Try Debian packages first (more reliable), fallback to playwright install-deps
echo "🔍 Ensuring Playwright system dependencies are installed..."
if ! sudo apt-get install -y libnss3 libnspr4 libdbus-1-3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libatspi2.0-0t64 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libasound2t64 fonts-unifont > /dev/null 2>&1; then
  echo "   Attempting Playwright install-deps as fallback..."
  sudo yarn playwright install-deps chromium 2>&1 | grep -v "All required dependencies are installed" || true
fi

# Build the package
(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

snapshot() {
  local UPDATE_SNAPSHOTS=""
  if [ "$PLAYWRIGHT_UPDATE_SNAPSHOTS" = "1" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
  fi
  # Use HTML reporter - saves report to playwright-report/, artifacts to test-results/
  # Continue on failure so we can generate report even if tests fail
  if ! npx playwright test \
    --reporter=html \
    --output=$RESULTS_DIR \
    --trace=on \
    $UPDATE_SNAPSHOTS \
    snapshot.test.ts; then
    TEST_FAILED=1
  fi
}

kill_app() {
  pids="$(lsof -ti:$PORT || true)"
  if [ -n "$pids" ]; then
    kill -9 $pids || true
  else
    echo "ok, no previous running process on port $PORT"
  fi
}
kill_app || true
trap kill_app EXIT INT TERM HUP
echo "ℹ️  Using PORT=$PORT"

#
# ██╗   ██╗██╗████████╗███████╗
# ██║   ██║██║╚══██╔══╝██╔════╝
# ██║   ██║██║   ██║   █████╗  
# ╚██╗ ██╔╝██║   ██║   ██╔══╝  
#  ╚████╔╝ ██║   ██║   ███████╗
#   ╚═══╝  ╚═╝   ╚═╝   ╚══════╝
#

appname=viteapp
appdir="$tmp/$appname"

# create app (use flags to skip all prompts)
(cd $tmp; npm create vite@latest $appname -- --template react-ts --no-rolldown --no-interactive)

# drei
(cd $appdir; npm i --no-fund --no-audit --silent; npm i $TGZ --no-fund --no-audit --silent)
# Pin three.js to minimum version from package.json peerDependencies (isolate upstream changes)
(cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

# App.tsx
cp App.tsx $appdir/src/App.tsx

# build+start+playwright
(cd $appdir; npm run build; npm run preview -- --host --strictPort --port $PORT &)
snapshot
kill_app

#
# ███╗   ██╗███████╗██╗  ██╗████████╗
# ████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝
# ██╔██╗ ██║█████╗   ╚███╔╝    ██║   
# ██║╚██╗██║██╔══╝   ██╔██╗    ██║   
# ██║ ╚████║███████╗██╔╝ ██╗   ██║   
# ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝   
#

appname=nextapp
appdir="$tmp/$appname"

# create app (use --yes to skip all prompts and use defaults)
(cd $tmp; npx -y create-next-app@latest $appname --ts --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*" --yes || true)

# drei (check if directory exists first, create-next-app might have failed)
if [ -d "$appdir" ]; then
  (cd $appdir; npm i $TGZ --no-fund --no-audit --silent)
  # Pin three.js to minimum version from package.json peerDependencies (isolate upstream changes)
  (cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

  # App.tsx
  cp App.tsx $appdir/app/page.tsx

  # build+start+playwright
  (cd $appdir; npm run build; npm start -- -p $PORT &)
  snapshot
  kill_app
else
  echo "⚠️  Warning: $appdir was not created, skipping nextapp test..."
fi

#  ██████╗     ██╗███████╗
# ██╔════╝     ██║██╔════╝
# ██║          ██║███████╗
# ██║     ██   ██║╚════██║
# ╚██████╗╚█████╔╝███████║
#  ╚═════╝ ╚════╝ ╚══════╝
# 
# (using Next.js)
#

appname=cjsapp
appdir="$tmp/$appname"

# create app (use --yes to skip all prompts and use defaults)
(cd $tmp; npx -y create-next-app@latest $appname --ts --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*" --yes || true)

# drei (check if directory exists first, create-next-app might have failed)
if [ -d "$appdir" ]; then
  (cd $appdir; npm i $TGZ --no-fund --no-audit --silent)
  # Pin three.js to minimum version from package.json peerDependencies (isolate upstream changes)
  (cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

  # App.tsx
  cp App.tsx $appdir/app/page.tsx

  # next.config.mjs
  cat <<EOF >$appdir/next.config.mjs
console.log('🦆 CJS override (next.config.mjs)')
import path from 'path'

/** @type {import('next').NextConfig} */
export default {
  //
  // We force Next to use drei's CJS version here
  //
  webpack: (config) => {
    config.resolve.alias['@react-three/drei'] = path.resolve('node_modules/@react-three/drei/index.cjs.js')
    return config
  },
  // Silence Turbopack warning - we're using webpack for CJS override
  turbopack: {},
}
EOF

  # build+start+playwright
  (cd $appdir; npm run build; npm start -- -p $PORT &)
  snapshot
  kill_app
else
  echo "⚠️  Warning: $appdir was not created, skipping cjsapp test..."
fi

#
#  ██████╗██████╗  █████╗ 
# ██╔════╝██╔══██╗██╔══██╗
# ██║     ██████╔╝███████║
# ██║     ██╔══██╗██╔══██║
# ╚██████╗██║  ██║██║  ██║
#  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
#

# appname=craapp
# appdir="$tmp/$appname"

# # create app
# (cd $tmp; npx create-react-app $appname --template typescript)

# # drei
# (cd $appdir; npm i $TGZ)

# # App.tsx
# cp App.tsx $appdir/src/App.tsx

# # build+start+playwright
# (cd $appdir; npm run build; npx serve -s -p $PORT build &)
# snapshot
# kill_app

#
# Teardown
#

# HTML report is automatically generated by --reporter=html
# Temporarily disable trace mode for clean output
set +x
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Test Results & Artifacts:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📁 Actual Screenshots:   test/e2e/$RESULTS_DIR/"
echo "  📁 Visual Diffs:         test/e2e/$RESULTS_DIR/ (when tests fail)"
echo "  📁 HTML Report:          test/e2e/$REPORT_DIR/"
echo "  📁 Expected Snapshots:   test/e2e/snapshot.test.ts-snapshots/"
echo ""
echo "  🌐 View HTML Report:     yarn test:report"
echo "  📊 Or open directly:     test/e2e/$REPORT_DIR/index.html"
echo ""
if [ "$TEST_FAILED" = "1" ]; then
  echo "  ⚠️  Tests failed! Check the HTML report for visual diffs."
  echo ""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$TEST_FAILED" = "1" ]; then
  echo "❌ e2e tests failed - see report above for details"
  set -x
  exit 1
else
  echo "✅ e2e ok"  
fi
set -x
