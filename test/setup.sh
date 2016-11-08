#!/bin/bash
# Setup the test environment.

OL_VER="3.15.1"
JQ_VER="3.1.0"
BB_VER="6.13.0"

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

npm install
npm run test-build

function download_if_not_found {
  if [ ! -f "$1" ]; then
    curl -o "$1" "$2"
  fi
}

# Download selenium server.
download_if_not_found "$TEST/selenium.jar" "http://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.1.jar"

# Download OpenLayers files.
download_if_not_found "$TEST/www/ol.css" "https://cdnjs.cloudflare.com/ajax/libs/ol3/$OL_VER/ol.css"

download_if_not_found "$TEST/www/ol.js" "https://cdnjs.cloudflare.com/ajax/libs/ol3/$OL_VER/ol.js"
download_if_not_found "$TEST/www/jquery.js" "https://cdnjs.cloudflare.com/ajax/libs/jquery/$JQ_VER/jquery.js"
download_if_not_found "$TEST/www/babel-polyfill.js" "https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/$BB_VER/polyfill.js"
