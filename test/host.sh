#!/bin/bash
# Start the test server.

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

node "$TEST/server.js" 5000
