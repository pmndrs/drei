#!/bin/sh
set -ex

PORT=5188
DIST=../../dist
PID_FILE=/tmp/drei-e2e.pid

(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

kill_app() {
  kill $(cat $PID_FILE)
}

cleanup() {
    kill_app || true
}
cleanup
trap cleanup EXIT

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

# build+start+jest
(cd $appdir; npm run build; npm run preview -- --host --port $PORT & echo $! > $PID_FILE)
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

# build+start+jest
(cd $appdir; npm run build; npm start -- -p $PORT & echo $! > $PID_FILE)
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

# build+start+jest
(cd $appdir; npm run build; npx serve -s -p $PORT build & echo $! > $PID_FILE)
npx playwright test snapshot.test.js
kill_app

#
# Teardown
#

echo "✅ e2e ok"
