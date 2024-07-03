#!/bin/bash

set -e

zits --no-fn --no-proxy -i submodules/zome-signals -o packages/cell-proxy/src/zomeSignals.ts

zits -d 'import {NotificationsLinkType as LinkTypes} from "./notifications.integrity"' -i submodules/notifications/zomes/coordinator/notifications -i submodules/notifications/zomes/integrity/notifications -o packages/notifications-dvm/src/bindings/notifications.ts

zits -d 'import {ProfilesLinkType as LinkTypes} from "./profiles.integrity"' -i submodules/profiles/crates/coordinator -i submodules/profiles/crates/integrity -o packages/profiles-dvm/src/bindings/profiles.ts

zits --default-zome-name profiles -i submodules/profiles_alt_zome/crates/alt_coordinator -i submodules/profiles/crates/integrity -i submodules/zome-signals -o packages/profiles-dvm/src/bindings/profilesAlt.ts
