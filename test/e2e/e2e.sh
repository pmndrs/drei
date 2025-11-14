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
BLOB_ROOT="blob-reports"
SNAPSHOT_RESULTS="snapshot-results"
rm -rf "$RESULTS_DIR" 2>/dev/null || true
rm -rf "$SNAPSHOT_RESULTS" 2>/dev/null || true
mkdir -p "$REPORT_DIR" "$RESULTS_DIR"
mkdir -p "$SNAPSHOT_RESULTS"
# Start fresh blob collector (single flat directory)
rm -rf "$BLOB_ROOT" 2>/dev/null || true
mkdir -p "$BLOB_ROOT"

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
# Ensure baseline alias exists for Playwright's default {projectName}-{platform} suffix
SNAP_DIR="snapshot.test.ts-snapshots"
BASELINE="$SNAP_DIR/should-match-previous-one-1-${THREE_VERSION}-linux.png"
ALIAS="$SNAP_DIR/should-match-previous-one-1-${THREE_VERSION}-chromium-linux.png"
if [ -f "$BASELINE" ] && [ ! -f "$ALIAS" ]; then
  cp "$BASELINE" "$ALIAS" || true
fi
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

write_pw_config() {
  local label="${RUN_LABEL:-run}"
  local test_dir="$(pwd)"
  PW_CONFIG="$tmp/pw.$label.config.js"
  cat >"$PW_CONFIG" <<EOF
// Auto-generated per-run config to preserve project name in merged reports
module.exports = {
  // Force discovery from the e2e directory regardless of config file location
  testDir: "${test_dir}",
  testMatch: ['snapshot.test.ts'],
  expect: {
    // Use shared baseline per platform, not per project (no projectName in path)
    snapshotPathTemplate: '{testDir}/snapshot.test.ts-snapshots/{arg}-{platform}{ext}',
  },
  projects: [
    {
      // Use a stable project name so Playwright does NOT suffix snapshots with project name
      // We prefix test titles with RUN_LABEL instead for per-run identification
      name: "chromium",
      use: { browserName: 'chromium' },
    },
  ],
};
EOF
}

snapshot() {
  local UPDATE_SNAPSHOTS=""
  if [ "$PLAYWRIGHT_UPDATE_SNAPSHOTS" = "1" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
  fi
  # Use blob reporter per pass; we will merge into a single HTML report at the end
  # Continue on failure so we can generate reports even if tests fail
  write_pw_config
  if ! npx playwright test \
      -c "$PW_CONFIG" \
      --reporter=blob \
      --output=$RESULTS_DIR \
      --trace=on \
      $UPDATE_SNAPSHOTS \
      snapshot.test.ts; then
    TEST_FAILED=1
  fi
  # Move blob-report to labeled directory for later merge
  if [ -d "blob-report" ]; then
    # Flatten into single collector dir and make filenames unique per run
    # Playwright may emit 'report.jsonl' or 'report-<hash>.zip' - prefix with RUN_LABEL to avoid overwrites
    for f in blob-report/*; do
      [ -e "$f" ] || continue
      base="$(basename "$f")"
      mv "$f" "$BLOB_ROOT/${RUN_LABEL:-run}-$base" 2>/dev/null || cp "$f" "$BLOB_ROOT/${RUN_LABEL:-run}-$base" 2>/dev/null || true
    done
    rm -rf blob-report 2>/dev/null || true
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

# Track and reliably kill started servers (including children)
SERVER_PID=""
SELF_PGID="$(ps -o pgid= -p $$ | tr -d ' ' || true)"
start_server() {
  app_dir="$1"
  cmd="$2"
  (
    cd "$app_dir" || exit 1
    # start in its own session/group to isolate from this script
    setsid sh -c "exec $cmd" >/dev/null 2>&1 &
    echo $! > .server.pid
  )
  SERVER_PID="$(cat "$app_dir/.server.pid" 2>/dev/null || true)"
  echo "🟢 server started pid=$SERVER_PID cmd=\"$cmd\" (self pgid=$SELF_PGID)"
}
kill_server() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    PGID="$(ps -o pgid= -p "$SERVER_PID" | tr -d ' ' || true)"
    if [ -n "$PGID" ] && [ "$PGID" != "$SELF_PGID" ]; then
      kill -TERM "-$PGID" 2>/dev/null || true
      sleep 0.3
      kill -KILL "-$PGID" 2>/dev/null || true
      echo "🔴 killed server pid=$SERVER_PID pgid=$PGID"
    else
      kill "$SERVER_PID" 2>/dev/null || true
      sleep 0.3
      kill -9 "$SERVER_PID" 2>/dev/null || true
      echo "🔴 killed server pid=$SERVER_PID"
    fi
  fi
  # Additionally, kill the actual listener on PORT (handles detached Next child)
  LISTENER_PID="$(lsof -ti:$PORT || true)"
  if [ -n "$LISTENER_PID" ]; then
    L_PGID="$(ps -o pgid= -p "$LISTENER_PID" | tr -d ' ' || true)"
    if [ -n "$L_PGID" ] && [ "$L_PGID" != "$SELF_PGID" ]; then
      kill -TERM "-$L_PGID" 2>/dev/null || true
      sleep 0.3
      kill -KILL "-$L_PGID" 2>/dev/null || true
    fi
    sleep 0.3
    kill "$LISTENER_PID" 2>/dev/null || true
    pkill -P "$LISTENER_PID" 2>/dev/null || true
    kill -9 "$LISTENER_PID" 2>/dev/null || true
  fi
  # Final fallback by socket
  fuser -k -n tcp $PORT 2>/dev/null || true
  # Wait until port is actually free (max ~5s)
  for _i in 1 2 3 4 5 6 7 8 9 10; do
    if ! lsof -ti:$PORT >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
  SERVER_PID=""
}

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
(echo "🧪 [$appname] Installing three@${THREE_VERSION_FULL}") || true
(cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

# App.tsx
cp App.tsx $appdir/src/App.tsx

# build+start+playwright
export RUN_LABEL="min-viteapp"
(cd $appdir; npm run build)
start_server "$appdir" "npm run preview -- --host --strictPort --port $PORT"
snapshot
kill_server

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
  (echo "🧪 [$appname] Installing three@${THREE_VERSION_FULL}") || true
  (cd $appdir; npm i three@${THREE_VERSION_FULL} @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)

  # App.tsx
  cp App.tsx $appdir/app/page.tsx

  # build+start+playwright
  export RUN_LABEL="min-nextapp"
  (cd $appdir; npm run build)
  start_server "$appdir" "npm start -- -p $PORT"
  snapshot
  kill_server
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
  (echo "🧪 [$appname] Installing three@${THREE_VERSION_FULL}") || true
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
  export RUN_LABEL="min-cjsapp"
  (cd $appdir; npm run build)
  start_server "$appdir" "npm start -- -p $PORT"
  snapshot
  kill_server
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
# Optional latest pass (viteapp only) if no CLI version provided
if [ -z "$1" ]; then
  # Resolve latest from range in package.json (prefer peerDependencies, fallback to devDependencies)
  LATEST_RANGE=$(node -e "const p=require('../../package.json'); const r=p.peerDependencies?.three||p.devDependencies?.three||''; if(!r){process.exit(1)}; console.log(r);")
  set +x
  echo "🔁 Running latest pass using range: ${LATEST_RANGE} (from package.json)"
  set -x

  appname=viteapp_latest
  appdir="$tmp/$appname"
  (cd $tmp; npm create vite@latest $appname -- --template react-ts --no-rolldown --no-interactive)
  (cd $appdir; npm i --no-fund --no-audit --silent; npm i $TGZ --no-fund --no-audit --silent)
  (echo "🧪 [$appname] Installing three@${LATEST_RANGE}") || true
  (cd $appdir; npm i "three@${LATEST_RANGE}" @react-three/fiber@^9.0.0 --no-fund --no-audit --silent)
  cp App.tsx $appdir/src/App.tsx
  export RUN_LABEL="latest-viteapp"
  (cd $appdir; npm run build)
  start_server "$appdir" "npm run preview -- --host --strictPort --port $PORT"
  snapshot
  kill_server
fi

# Teardown and report merge
set +x
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Test Results & Artifacts:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📁 Actual Screenshots:   test/e2e/$RESULTS_DIR/"
echo "  📁 Blob Reports:         test/e2e/$BLOB_ROOT/"
echo "  📁 Expected Snapshots:   test/e2e/snapshot.test.ts-snapshots/"
echo ""
set -x
# Merge all blobs from the single collector directory into one HTML
PLAYWRIGHT_HTML_REPORT="$REPORT_DIR" npx playwright merge-reports --reporter=html "$BLOB_ROOT" || true
set +x
echo "  📁 HTML Report:          test/e2e/$REPORT_DIR/"
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
