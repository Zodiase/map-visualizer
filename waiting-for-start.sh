#!/bin/bash

echo "waiting for servers to start..."
declare -a arr=("npm" "java")
for pid in ${arr[@]}; do
  while true; do
    echo $pid
    if ! pgrep -n -f $pid > /dev/null; then
      sleep 1;
      echo "still waiting..."
      echo $(pgrep -n -f npm)
    else
      echo "All needed background processes start running!"
      break
    fi
  done
done