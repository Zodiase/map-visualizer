#!/bin/bash
# Build the project and copy the built files to the testing environment.

# Get script directory.
TEST="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$TEST/.."

npm run build

BUILTLIB="lib/viewer.js"
TESTLIB="test/www/viewer.js"

# Copy the built file to www.
cp "$ROOT/$BUILTLIB" "$ROOT/$TESTLIB"

printf "$BUILTLIB > $TESTLIB\n"
