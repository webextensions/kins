#!/bin/bash

# cd to the folder containing this script
cd "$(dirname "$0")"

cd ../..
npx package-cjson generate-package.json
