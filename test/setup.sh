#!/bin/bash
# Setup the test environment.

OL_VER="3.15.1"
JQ_VER="2.2.4"
BB_VER="6.9.1"

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

npm install
npm run test-build

# Download selenium server.
curl -o "$TEST/selenium.jar" "http://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.0.jar"

# Download OpenLayers files.
curl -o "$TEST/www/ol.css" "https://cdnjs.cloudflare.com/ajax/libs/ol3/$OL_VER/ol.css"
curl -o "$TEST/www/ol.js" "https://cdnjs.cloudflare.com/ajax/libs/ol3/$OL_VER/ol.js"
curl -o "$TEST/www/jquery.js" "https://cdnjs.cloudflare.com/ajax/libs/jquery/$JQ_VER/jquery.js"
curl -o "$TEST/www/babel-polyfill.js" "https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/$BB_VER/polyfill.js"
