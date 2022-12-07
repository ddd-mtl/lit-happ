# cell-proxy

Proxy classes and helpers for managing a Holochain AppWebsocket.
The intent is to make the development of web UI of Holochain apps in javascript / typescript faster & easier by providing a straightforward API for communicating with a Conductor, and some basic logging features.


## Installing

```bash
npm i @ddd-qc/cell-proxy
```

## API

### Holochain Cell Locator

A running Holochain cell can be refered by its `CellId`, but Holochain's API does not provide a way for refering to a cell based on its intended use by a happ.
A cell is typically created from a Role in a `AppManifest`. It can also be created as a clone of an existing cell.
This package propose the `Holochain Cell Locator`, a way to refer to a cell by its AppId, RoleName and CloneIndex.
The format is:
`hcl://<InstalledAppId>/<BaseRoleName>/<CloneName | CloneIndex>`

Example:
`hcl://where/profiles`
`hcl://where/ludotheque/europe`

The `BaseRoleName` is the `RoleName` as defined in the `AppManifest`, without the appended cloneIndex (if it is clonable).
The `RoleName` with the appended cloneIndex is refered as `RoleInstanceId`.

This way of addresssing clones makes it straightforward for querying all the cells of an happ or all the cells of a particular role for example.

The HCL string is named `HCL`, whereas the HCL object is named `CellLocation`.


### `ConductorAppProxy`
`ConductorAppProxy` is the main class that wraps an AppWebsocket and represents the conductor.

 - It keeps track of all the created cells by storing the `InstalledCells` in a retrievable way using `HCL` addresssing.
 - It manages all signalHandlers and logs all signals received.
 - It creates and stores every `CellProxy`.

A `ConductorAppProxy` can be created by providing an already existing `AppWebSocket` or by providing a local port where it will try to create an `AppWebSocket` internally by connecting to that port.


### `CellProxy` 

`CellProxy` represents a running Cell, it provides a simple API for calling zome functions.

 - It logs all zome calls made to that cell.
 - It logs all received signals.

 A `CellProxy` can only be created by a `ConductorAppProxy` by calling `ConductorAppProxy.createCellProxy()`.
 Zome calls that write to the source-chain should use the entry point `CellProxy.callZomeBlocking()`, that guarantees that no other blocking call runs in parallel, so to ensure there is no "source-chain" head rewrite errors.


### `ZomeProxy` 

`ZomeProxy` is an abstract base class that makes use of a `CellProxy` for a specific zome.
A subclass is expected to provide all the zome functions of a zome as directly callable methods.
Example: `profilesProxy.fetchAllProfiles()`


## Example use

```=typescript
const profilesHcl = new HCL("where", "profiles");
/** Create AppProxy from provided local port */
const conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
/** Query and map out all the runnings cells for a Role in a happ */
const cellMap = await conductorAppProxy.mapInstalledCells(profilesHcl);
if (!cellMap.include(profilesHcl.baseRoleName)) {
  throw Error("Profiles role not installed in happ");
}
/** Create a CellProxy for the "profiles" role */
const profilesCellProxy = conductorAppProxy.createCellProxy(profilesHcl);
/** Call zome function on the "profiles" zome" */
const profiles = await profilesCellProxy.callZome("profiles", "fetchAllProfiles", null);
/** Dump all logs to console */
conductorAppProxy.dumpLogs();
```