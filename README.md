# lit-happ

**Compatible with:**
- **HDK v0.0.154** & **HDI v0.1.3**
- **@holochain/client v0.9.3**

A MVVM framework for building holochain apps web UI with Lit.

Composed of two packages:
 - [cell-proxy](packages/cell-proxy): Defines Conductor and Cell Proxy classes for using a holochain conductor.
 - [lit-happ](packages/lit-happ): The main framework that defines ViewModels and helper Elements for using them.



# Playgrounds

in `/example` you can fin example happs, which have:

Zomes:
 - **Integer:** Zome with just an Integer (u32) Entry type that can be created, and listed.
 - **Real:** Zome with just a Real (f32) Entry type that can be created, and listed.
 - **Label:** Zome with just a Label (string) Entry type that can be created, and listed.

Dnas:
 - **NamedInteger:** Integer + Label zomes
 - **NamedReal:** Real + label zomes


### Basic example 

Happ with two dnas in three roles

`npm run devtest`


### Cloning example

Happ with two dnas in two clonable roles

`npm run devtest:clone`

