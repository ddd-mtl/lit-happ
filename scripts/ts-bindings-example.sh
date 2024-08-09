#!/bin/bash

set -e

zits --default-zome-name zInteger -i example/dna/integer -i example/dna/integer_integrity -o example/src/bindings/integer.ts
zits --default-zome-name zLabel -i example/dna/label -i example/dna/label_integrity -o example/src/bindings/label.ts
zits --default-zome-name zReal -i example/dna/real -i example/dna/real_integrity -o example/src/bindings/real.ts
