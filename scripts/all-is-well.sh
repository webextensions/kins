#!/bin/bash

# cd to the folder containing this script
cd "$(dirname "$0")"

# cd to project root
cd ..

# https://stackoverflow.com/questions/16080716/execute-multiple-commands-in-a-bash-script-sequentially-and-fail-if-at-least-one/16081218#16081218

EXIT_STATUS=0

echo "$ ./scripts/health-checks/check-node-version.js --return-exit-code"
        ./scripts/health-checks/check-node-version.js --return-exit-code                                 || EXIT_STATUS=$?

echo "$ ./scripts/health-checks/check-npm-install-status/check-npm-install-status.js --return-exit-code"
        ./scripts/health-checks/check-npm-install-status/check-npm-install-status.js --return-exit-code  || EXIT_STATUS=$?

        npm run lint                                                                                     || EXIT_STATUS=$?

        npm run mocha-forbid-only                                                                        || EXIT_STATUS=$?

exit $EXIT_STATUS
