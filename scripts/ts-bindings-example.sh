#!/bin/bash

set -e

zits --default-zome-name zInteger -i playgrounds/zomes/integer -i playgrounds/zomes/integer_integrity -o playgrounds/webapp/src/bindings/integer.ts
zits --default-zome-name zLabel -i playgrounds/zomes/label -i playgrounds/zomes/label_integrity -o playgrounds/webapp/src/bindings/label.ts
zits --default-zome-name zReal -i playgrounds/zomes/real -i playgrounds/zomes/real_integrity -o playgrounds/webapp/src/bindings/real.ts
zits --default-zome-name zTasker -i submodules/zdk/zomes/zome_core -i playgrounds/zomes/tasker -i playgrounds/zomes/tasker_model -o playgrounds/webapp_tasker/src/bindings/tasker.ts
