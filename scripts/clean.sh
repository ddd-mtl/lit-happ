#!/bin/bash

# TOP LEVEL
# cell-proxy
rm -rf packages/cell-proxy/dist
rm packages/cell-proxy/tsconfig.tsbuildinfo
# lit-happ
rm -rf packages/lit-happ/dist
rm packages/lit-happ/tsconfig.tsbuildinfo
# playgrounds
rm -rf playgrounds/webapp/out-tsc/
rm -rf playgrounds/webapp/dist/
rm -rf playgrounds/webapp/target/
rm playgrounds/webapp/.hc*
rm playgrounds/we-applet/.hc*
rm playgrounds/webapp/tsconfig.tsbuildinfo
rm playgrounds/Cargo.lock
rm artifacts/*.dna
rm artifacts/*.happ

