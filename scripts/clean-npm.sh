#!/bin/bash

# TOP LEVEL
rm -rf node_modules
rm package-lock.json
# cell-proxy
rm -rf packages/cell-proxy/node_modules
rm packages/cell-proxy/package-lock.json
# lit-happ
rm -rf packages/lit-happ/node_modules/
rm packages/lit-happ/package-lock.json
# example
rm -rf example/webapp/node_modules/
rm example/webapp/package-lock.json
# example we-applet
rm -rf example/we-applet/node_modules/
rm example/we-applet/package-lock.json
# example
rm -rf example/node_modules/