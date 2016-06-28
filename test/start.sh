#!/bin/bash

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

# Start selenium server in the background and record its PID.
java -jar "$TEST/selenium.jar" -Dphantomjs.binary.path="$ROOT/node_modules/.bin/phantomjs" > /dev/null 2>&1 &
SELENIUM=$(pgrep -n -f java)

# Start the node server in the background and record its PID.
node "$TEST/server.js" > /dev/null 2>&1 &
NODE=$(pgrep -n -f node)

printf "\nWaiting for servers to start...\n..."
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

printf "\nKilling background processes...\n"
kill -9 $SELENIUM
kill -9 $NODE

declare -a arr=($SELENIUM $NODE)
for pid in ${arr[@]}; do
  while true; do
    if kill -0 $pid > /dev/null 2>&1; then
      sleep 1;
    else
      break
    fi
  done
done
