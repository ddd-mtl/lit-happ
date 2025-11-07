# Profiles DnaViewModel

DnaViewModel implementation for the SharedOwnership zome.


### Zome Requirements

To use this zome all implementing zomes are required to implement the following zome functions:

```rust
#[hdk_extern]
fn get_record_author(dh: AnyDhtHash) -> ExternResult<AgentPubKey> {
  return zome_utils::get_author(dh);
}

```

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2024, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
