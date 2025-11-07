#!/bin/bash

find . -type f -name "package-lock.json" -delete
find . -type d -name "node_modules" -prune -exec rm -rf {} +
