#!/bin/bash

rm playgrounds/webapp/.hc*
rm playgrounds/we-applet/.hc*

rm playgrounds/Cargo.lock
rm artifacts/*.dna
rm artifacts/*.happ

find . -type f -name "tsconfig.tsbuildinfo" -delete
find . -type d -name "dist" -prune -exec rm -rf {} +
find . -type d -name "target" -prune -exec rm -rf {} +
find . -type d -name "out-tsc" -prune -exec rm -rf {} +