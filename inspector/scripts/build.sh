#! /bin/bash

rm -rf dist/
npm run build:cli
npm run build:web
cp -r web/dist dist/web
chmod +x dist/index.js
