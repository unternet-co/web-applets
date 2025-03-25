#! /bin/sh

npm run sync-version

tag_latest() {
    local package_name=$(node -p "require('./package.json').name")
    local version=$(node -p "require('./package.json').version")
    echo "Tagging $package_name@$version as latest"
    npm dist-tag add "$package_name@$version" latest
}

cd sdk
tag_latest
cd ..

cd inspector
tag_latest
