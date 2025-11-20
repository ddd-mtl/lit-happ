#!/bin/sh

# Script for updating version number across the code base

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: new version number"
  exit 2
fi

update_package_version() {
    local package_path="$1"
    local new_version="$2"

    OLD_VER=$(awk -F ":" '/"version"/ {print $2}' "$package_path" | sed 's/"//g' | sed 's/,//g' | sed 's/ //g')
    echo "${package_path} ${OLD_VER} -> ${new_version}"
    sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$new_version\"/" "$package_path"
}


update_package_version "./packages/cell-proxy/package.json" $1
update_package_version "./packages/lit-happ/package.json" $1
update_package_version "./packages/we-utils/package.json" $1
update_package_version "./dvms/profiles/package.json" $1
update_package_version "./dvms/shared-ownership/package.json" $1
update_package_version "./dvms/path-explorer/package.json" $1
update_package_version "./dvms/agent-directory/package.json" $1
