#!/bin/bash

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

# Start selenium server in the background and record its PID.
java -jar "$TEST/selenium.jar" -Dphantomjs.binary.path="$ROOT/node_modules/.bin/phantomjs" > /dev/null 2>&1 &

# Start the node server in the background and record its PID.
node "$TEST/server.js" > /dev/null 2>&1 &

printf "\nWaiting for servers to start..."
while true; do
  if ! curl --output /dev/null --silent --head --fail http://localhost:4444/wd/hub || ! curl --output /dev/null --silent --head --fail http://localhost:4000; then
    sleep 1;
    printf "."
  else
    printf "Done\n"
    break
  fi
done

printf "\nRunning tests with WebDriver...\n"
"$ROOT/node_modules/.bin/wdio" "$TEST/wdio.conf.js"

printf "\nKilling background processes..."
kill $(jobs -rp) && wait $(jobs -rp) > /dev/null 2>&1
printf "Done\n"
