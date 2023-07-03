#!/bin/sh
set -ex

PORT=5188

(cd ../../dist; npm pack)

kill_app() {
  kill $(lsof -ti:$PORT)
}

kill_app || echo "ok, no previous running process on port $PORT"

#
# ██╗   ██╗██╗████████╗███████╗
# ██║   ██║██║╚══██╔══╝██╔════╝
# ██║   ██║██║   ██║   █████╗  
# ╚██╗ ██╔╝██║   ██║   ██╔══╝  
#  ╚████╔╝ ██║   ██║   ███████╗
#   ╚═══╝  ╚═╝   ╚═╝   ╚══════╝
#

rm -rf viteapp

# Vite
npm create vite@latest viteapp -- --template react

# drei
(cd viteapp; npm i; npm i ../../../dist/react-three-drei-0.0.0-semantic-release.tgz)

# App.jsx
cp App.jsx viteapp/src/App.jsx

# npm run dev + jest
(cd viteapp; npm run build; npm run preview -- --port $PORT &)
npx jest snapshot.test.js || kill_app
kill_app

rm -rf viteapp

#
#  ██████╗██████╗  █████╗ 
# ██╔════╝██╔══██╗██╔══██╗
# ██║     ██████╔╝███████║
# ██║     ██╔══██╗██╔══██║
# ╚██████╗██║  ██║██║  ██║
#  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
#

rm -rf craapp

# CRA
npx create-react-app craapp

# drei
(cd craapp; npm i ../../../dist/react-three-drei-0.0.0-semantic-release.tgz)

# App.jsx
cp App.jsx craapp/src/App.js

# npm run dev + jest
(cd craapp; npm run build; npx serve -s -p $PORT build &)
npx jest snapshot.test.js || kill_app
kill_app

rm -rf craapp

#
# Teardown
#

echo "✅ e2e ok"