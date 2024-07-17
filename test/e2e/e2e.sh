#!/bin/sh
set -ex

PORT=5188
DIST=../../dist

(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

kill_app() {
  kill -9 $(lsof -ti:$PORT) || echo "ok, no previous running process on port $PORT"
}

cleanup() {
  kill_app
}
cleanup || true
trap cleanup EXIT INT TERM HUP

tmp=$(mktemp -d)

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

# create app
(cd $tmp; npm create vite@latest $appname -- --template react)

# drei
(cd $appdir; npm i; npm i $TGZ)

# App.jsx
cp App.jsx $appdir/src/App.jsx

# build+start+playwright
(cd $appdir; npm run build; npm run preview -- --host --port $PORT &)
npx playwright test snapshot.test.js
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

# create app
(cd $tmp; npx -y create-next-app@latest $appname --js --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*")

# drei
(cd $appdir; npm i $TGZ)

# App.jsx
cp App.jsx $appdir/app/page.js

# build+start+playwright
(cd $appdir; npm run build; npm start -- -p $PORT &)
npx playwright test snapshot.test.js
kill_app

#
#  ██████╗██████╗  █████╗ 
# ██╔════╝██╔══██╗██╔══██╗
# ██║     ██████╔╝███████║
# ██║     ██╔══██╗██╔══██║
# ╚██████╗██║  ██║██║  ██║
#  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
#

appname=craapp
appdir="$tmp/$appname"

# create app
(cd $tmp; npx create-react-app $appname)

# drei
(cd $appdir; npm i $TGZ)

# App.jsx
cp App.jsx $appdir/src/App.js

# build+start+playwright
(cd $appdir; npm run build; npx serve -s -p $PORT build &)
npx playwright test snapshot.test.js
kill_app

#
# Teardown
#

echo "✅ e2e ok"
