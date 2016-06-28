#!/bin/bash

printf "%s\n" "waiting for all background process to stop..."
declare -a arr=("npm" "java")
for pid in ${arr[@]}; do
  while true; do
    if pgrep -n -f $pid > /dev/null; then
      sleep 1;
      printf "%s still running\n" "$pid"
    else
      printf "finish killing exisiting process: %s\n" "$pid"
      break
    fi
  done
done