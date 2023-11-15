#!/bin/bash

# Script for downloading prebuilt "hc" binary

echo Executing \"$0\".

echo \* Create 'submodules' folder
rm -rf submodules
mkdir submodules

cd submodules
echo \* Download latest install scripts
git clone -b "0.2-merge" --depth 1 https://github.com/holochain-open-dev/notifications
#git clone --depth 1 https://github.com/ddd-mtl/notifications

cd ..

echo
echo \* Done
