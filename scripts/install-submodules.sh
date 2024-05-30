#!/bin/bash

# Script for downloading prebuilt "hc" binary

echo Executing \"$0\".

echo \* Create 'submodules' folder
rm -rf submodules
mkdir submodules

cd submodules
echo \* Download latest notifications zome
#git clone -b "0.2-merge" --depth 1 https://github.com/holochain-open-dev/notifications
git clone --depth 1 https://github.com/ddd-mtl/notifications

echo \* Download latest profiles zome
git clone -b "for-hdk-v0.4.0-dev.1" --depth 1 https://github.com/holochain-open-dev/profiles

echo \* Download latest profiles-alt zome
git clone -b "hdk-4.0" --depth 1 https://github.com/ddd-mtl/profiles_alt_zome.git

cd ..

echo
echo \* Done
