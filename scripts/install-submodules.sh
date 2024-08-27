#!/bin/bash

# Script for downloading submodule dependencies

echo Executing \"$0\".

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: holochain version"
  exit 2
fi

hcversion=$1
echo for holochain version $hcversion
if [ "$hcversion" == "hc" ] || [ "$hcversion" == "" ] ; then
  echo Missing \"hc-version\" field in \"package.json\".
  exit 1
fi
branchname=hdk-${hcversion:2}
echo Getting branch: $branchname
profileHdkVersion=for-hdk-0.4.0-dev.14

echo \* Create 'submodules' folder
rm -rf submodules
mkdir submodules

cd submodules
echo \* Download latest notifications zome
#git clone -b "0.2-merge" --depth 1 https://github.com/holochain-open-dev/notifications
git clone --depth 1 https://github.com/ddd-mtl/notifications

echo \* Download latest profiles zome
git clone -b $profileHdkVersion --depth 1 https://github.com/holochain-open-dev/profiles

echo \* Download zome-signals repo
git clone -b $branchname --depth 1 https://github.com/ddd-mtl/zome-signals.git

echo \* Download latest profiles-alt zome
git clone -b $branchname --depth 1 https://github.com/ddd-mtl/profiles_alt_zome.git

cd ..

echo
echo \* Done
