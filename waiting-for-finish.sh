#!/bin/bash

echo "waiting for all background process to stop..."
declare -a arr=("npm" "java")
for pid in ${arr[@]}; do
  while true; do
    echo $pid
    if pgrep -n -f $pid > /dev/null; then
      sleep 1;
      echo "still running..."
      echo $(pgrep -n -f npm)
    else
      echo "finish killing exisiting processes!"
      break
    fi
  done
done