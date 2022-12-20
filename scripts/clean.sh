#!/bin/bash

# TOP LEVEL
# cell-proxy
rm -rf packages/cell-proxy/dist
rm packages/cell-proxy/tsconfig.tsbuildinfo
# lit-happ
rm -rf packages/lit-happ/dist
rm packages/lit-happ/tsconfig.tsbuildinfo
# example
rm -rf example/.rollup.cache/
rm -rf example/out-tsc/
rm -rf example/dist/
rm -rf example/target/
rm example/.hc*
rm example/tsconfig.tsbuildinfo
rm example/Cargo.lock
rm artifacts/*.dna
rm artifacts/*.happ

