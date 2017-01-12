#!/bin/bash
# Build the project and copy the built files to the testing environment.

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

npm run build

BUILTLIB="lib/app.js"
TESTLIB="test/www/app.js"

# Copy the built file to www.
cp "$ROOT/$BUILTLIB" "$ROOT/$TESTLIB"

printf "$BUILTLIB > $TESTLIB\n"
