#! /bin/sh

npm run sync-version
cd sdk && npm publish && cd ..
cd inspector && npm publish