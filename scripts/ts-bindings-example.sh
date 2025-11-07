#!/bin/bash

set -e

zits --default-zome-name zInteger -i playgrounds/dna/integer -i playgrounds/dna/integer_integrity -o playgrounds/webapp/src/bindings/integer.ts
zits --default-zome-name zLabel -i playgrounds/dna/label -i playgrounds/dna/label_integrity -o playgrounds/webapp/src/bindings/label.ts
zits --default-zome-name zReal -i playgrounds/dna/real -i playgrounds/dna/real_integrity -o playgrounds/webapp/src/bindings/real.ts
