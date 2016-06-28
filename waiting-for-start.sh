#!/bin/bash

printf "%s\n" "waiting for servers to start..."
while true; do
  if ! curl --output /dev/null --silent --head --fail http://localhost:4444/wd/hub || ! curl --output /dev/null --silent --head --fail http://localhost:4000; then
    sleep 1;
    printf "%s\n" "still waiting..."
  else
    printf "%s\n" "All needed background processes start running!"
    break
  fi
done