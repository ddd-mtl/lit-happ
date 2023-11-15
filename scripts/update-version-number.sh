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

# Change profiles-dvm/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/profiles-dvm/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/profiles-dvm/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/profiles-dvm/package.json

# Change notifications-dvm/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/notifications-dvm/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/notifications-dvm/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/notifications-dvm/package.json

# Change we-utils/package.json
OLD_VER=`awk -F ":" '/"version"/ {print $2}' ./packages/we-utils/package.json | sed 's/"//g' | sed 's/,//g' | sed 's/ //g'`
echo "./packages/we-utils/package.json $OLD_VER -> $1"
sed -i "s/\"version\": \"$OLD_VER\"/\"version\": \"$1\"/" ./packages/we-utils/package.json
