#!/bin/bash

set -e

zits -i submodules/notifications/zomes/coordinator/notifications -i submodules/notifications/zomes/integrity/notifications -o packages/notifications-dvm/src/bindings/notifications.ts

zits -i submodules/profiles/crates/coordinator -i submodules/profiles/crates/integrity -o packages/profiles-dvm/src/bindings/profiles.ts

zits --default-zome-name profiles -i submodules/profiles_alt_zome/crates/alt_coordinator -i submodules/profiles/crates/integrity -o packages/profiles-dvm/src/bindings/profilesAlt.ts
