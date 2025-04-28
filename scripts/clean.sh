#!/bin/bash

# TOP LEVEL
# cell-proxy
rm -rf packages/cell-proxy/dist
rm packages/cell-proxy/tsconfig.tsbuildinfo
# lit-happ
rm -rf packages/lit-happ/dist
rm packages/lit-happ/tsconfig.tsbuildinfo
# example
rm -rf example/webapp/.rollup.cache/
rm -rf example/webapp/out-tsc/
rm -rf example/webapp/dist/
rm -rf example/webapp/target/
rm example/webapp/.hc*
rm example/we-applet/.hc*
rm example/webapp/tsconfig.tsbuildinfo
rm example/Cargo.lock
rm artifacts/*.dna
rm artifacts/*.happ

