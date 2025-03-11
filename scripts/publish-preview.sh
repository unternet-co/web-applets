#!/bin/sh

npm run sync-version

cd sdk
npm publish --tag next
cd ..

cd inspector
npm publish --tag next