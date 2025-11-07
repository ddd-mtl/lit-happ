#!/bin/bash

# TOP LEVEL
rm -rf node_modules
rm package-lock.json
# cell-proxy
rm -rf packages/cell-proxy/node_modules
rm packages/cell-proxy/package-lock.json


find . -type f -name "package-lock.json" -delete
