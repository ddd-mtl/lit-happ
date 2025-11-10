#!/bin/bash

# Script for downloading submodule dependencies

echo Executing \"$0\".

# Check pre-conditions
if [ $# != 1 ]; then
  echo 1>&2 "$0: Aborting. Missing argument: holochain version"
  exit 2
fi

hcversion="${1:0:3}"
echo for holochain version $hcversion
if [ "$hcversion" == "hc" ] || [ "$hcversion" == "" ] ; then
  echo Missing \"hc-version\" field in \"package.json\".
  exit 1
fi
branchname=main-${hcversion}
echo Getting branch: $branchname

echo \* Create 'submodules' folder
rm -rf submodules
mkdir submodules

cd submodules

echo \* Download latest profiles zome
git clone -b $branchname --depth 1 https://github.com/holochain-open-dev/profiles

echo \* Download zdk repo
git clone -b $branchname --depth 1 https://github.com/ddd-mtl/zdk.git

cd ..

echo
echo \* Done
