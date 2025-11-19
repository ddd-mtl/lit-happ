#!/bin/bash

set -e

zits --no-fn --no-proxy -i submodules/zdk/crates/zome-signals -o packages/cell-proxy/src/zomeSignals.ts

zits -d 'import {ProfilesLinkType as LinkTypes} from "./profiles.integrity"' -i submodules/profiles/crates/coordinator -i submodules/profiles/crates/integrity -o dvms/profiles/src/bindings/profiles.ts

zits --default-zome-name profiles -f "cast_tip" -f "synchronize_tip" -i submodules/zdk/zomes/profiles_alt_coordinator -i submodules/profiles/crates/integrity -o dvms/profiles/src/bindings/profilesAlt.ts

zits --default-zome-name zSharedOwnership -f "cast_tip" -f "synchronize_tip" -i submodules/zdk/zomes/shared_ownership_coordinator -i submodules/zdk/zomes/shared_ownership_integrity -o dvms/shared-ownership/src/bindings/sharedOwnership.ts

zits -i submodules/zdk/zomes/agent_directory_integrity -i submodules/zdk/zomes/agent_directory -o dvms/agent-directory/src/bindings/agentDirectory.ts

zits --default-zome-name zPathExplorer -d "import {ItemLink, SweepInterval, SweepResponse} from './deps.types';" -i submodules/zdk/zomes/path_explorer_types -i submodules/zdk/zomes/zome_core -i submodules/zdk/zomes/path_explorer -o dvms/path-explorer/src/bindings/path-explorer.ts
