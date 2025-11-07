# lit-happ

A [MVVM](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel) framework for building [Holochain](https://www.holochain.org/) apps with [Lit](https://lit.dev/).

The framework is composed of 3 packages:
 - [@ddd-qc/cell-proxy](packages/cell-proxy): Defines *Conductor* and *Cell Proxy* classes for using a Holochain conductor.
 - [@ddd-qc/lit-happ](packages/lit-happ): The main package that defines *ViewModels* and base class Elements for using them in custom LitElements.
 - [@ddd-qc/we-utils](packages/we-utils): Helpers for making a [Moss](https://moss.social/) compatible version of a happ made with lit-happ.

 

The repo also provides Typescript bindings, DnaViewModels (DVMs) and web-elements for the zomes in the [ZDK](https://github.com/ddd-mtl/zdk):
- [@ddd-qc/profiles-dvm](@ddd-qc/profiles-dvm) for the [profiles zome](https://github.com/holochain-open-dev/profiles)
- [@ddd-qc/agent-directory](@ddd-qc/agent-directory) for the [agent_directory_zome](https://github.com/ddd-mtl/zdk/zomes/agent_directory)
- [@ddd-qc/shared-ownership-dvm](@ddd-qc/shared-ownership-dvm)for the [shared_ownership_zome](https://github.com/ddd-mtl/zdk/zomes/shared_ownership_zome)
- [@ddd-qc/path-explorer](@ddd-qc/path-explorer) for the [path_explorer zome](https://github.com/ddd-mtl/zdk/zomes/path_explorer)

# Playgrounds

in `/playgrounds` you can fin example happs

## Lit-happ Playground

Zomes:
 - **Integer:** Zome with just an Integer (u32) Entry type that can be created, and listed.
 - **Real:** Zome with just a Real (f32) Entry type that can be created, and listed.
 - **Label:** Zome with just a Label (string) Entry type that can be created, and listed.

Dnas:
 - **NamedInteger:** Integer + Label zomes
 - **NamedReal:** Real + label zomes


### Basic Playground 

Happ with two dnas in three roles

`npm run devtest`


### Clone Playground

Happ with two dnas in two clonable roles

`npm run devtest:clone`

## Tasker

A simple to-do app.

FIXME
