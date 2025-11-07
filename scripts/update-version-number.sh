#!/bin/sh

# Script for updating version number across the code base

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: new version number"
  exit 2
fi


# Change cell-proxy/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/cell-proxy/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/cell-proxy/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/cell-proxy/package.json

# Change lit-happ/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/lit-happ/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/lit-happ/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/lit-happ/package.json

# Change we-utils/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/we-utils/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/we-utils/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/we-utils/package.json

# Change profiles-dvm/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./dvms/profiles/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./dvms/profiles/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./dvms/profiles/package.json

# Change agent-directory/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./dvms/agent-directory/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./dvms/agent-directory/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./dvms/agent-directory/package.json

# Change shared-ownership-dvm/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./dvms/shared-ownership/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./dvms/shared-ownership/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./dvms/shared-ownership/package.json

# Change path-explorer/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./dvms/path-explorer/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./dvms/path-explorer/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./dvms/path-explorer/package.json