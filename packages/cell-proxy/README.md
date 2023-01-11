# cell-proxy

**Compatible with:**
- **HDK v0.1.0-beta-rc.1** & **HDI v0.2.0-beta-rc.1**
- **@holochain/client v0.11.9**
- 
Proxy classes and helpers for managing a [Holochain](https://www.npmjs.com/package/@holochain/client) AppWebsocket and calling zome functions on cells.
The intent is to make the development of web UI of Holochain apps in javascript / typescript faster & easier by providing a straightforward API for communicating with a Conductor, and some basic logging features.


## Installing

```bash
npm i @ddd-qc/cell-proxy
```

## API

### Holochain Cell Locator

In Holochain, a running Holochain cell can be refered to by its `CellId`, but Holochain's does not provide a way for refering to a cell based on its intended use by a happ. A cell is typically created from a Role in a `AppManifest`, as a clone or not.
This package propose the `Holochain Cell Locator`, a way to refer to a cell by its AppId, RoleName and CloneIndex or CloneName.
The format is:
`cell:/<InstalledAppId>/<BaseRoleName>/<CloneName | CloneIndex>`

The `BaseRoleName` is the `RoleName` as defined in the `AppManifest`, without the appended cloneIndex (if it is clonable).
The `RoleName` with the appended cloneIndex is refered as `RoleInstanceId`.

Examples:
`cell:/where/profiles`
`cell:/chatApp/channel/2`
`cell:/chatApp/channel/europe/0`

This way of addresssing clones makes it straightforward for querying all the cells of a happ or all the cells of a particular role for example.

The HCL string is named `HCLString`, whereas the HCL object is named `HCL`.


### ConductorAppProxy
`ConductorAppProxy` is the main class that wraps an AppWebsocket and represents the conductor.

 - It keeps track of all the created cells by storing the `InstalledCells` in a retrievable way using `HCL` addresssing.
 - It manages all signalHandlers and logs all signals received.
 - It creates and stores every `CellProxy`.

A `ConductorAppProxy` can be created by providing an already existing `AppWebSocket` or by providing a local port where it will try to create an `AppWebSocket` internally by connecting to that port.


### CellProxy 

`CellProxy` represents a running Cell, it provides a simple API for calling zome functions.

 - It logs all zome calls made to that cell.
 - It logs all received signals.

 A `CellProxy` can only be created by a `ConductorAppProxy` by calling `ConductorAppProxy.createCellProxy()`.
 Zome calls that write to the source-chain should use the entry point `CellProxy.callZomeBlocking()`, that guarantees that no other blocking call runs in parallel, so to ensure there is no "source-chain" head rewrite errors.


### ZomeProxy 

`ZomeProxy` is an abstract base class that makes use of a `CellProxy` for a specific zome.
A subclass is expected to provide all the zome functions of a zome as directly callable methods.
Example: `profilesProxy.fetchAllProfiles()`

A `ZomeProxy` subclass must define the static field `DEFAULT_ZOME_NAME` which is the way to know at runtime for what zome this subclass is for.


# Example

Imagine you have a happ that has a dna that uses a profile zome.

## Example without subclassing ZomeProxy
```typescript
/** HCL of the role we want to use */
const hcl = new HCL("myHapp", "myRole");
/** Create AppProxy from provided local port */
const appProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
/** Map out all the runnings cells for a Role in a happ. Required before calling createCellProxy */
await appProxy.fetchCells(hcl);
/** Create a CellProxy for the "myRole" role */
const profilesCellProxy = appProxy.createCellProxy(hcl);
/** Call zome function on the "profiles" zome  */
const handles = await profilesCellProxy.callZome("profiles", "fetch_all_handles", null);
/** Dump all logs to console */
appProxy.dumpLogs();
```


## Example with ZomeProxy subclass

#### ZomeProxy subclass

```typescript
export class ProfileZomeProxy extends ZomeProxy {

  static readonly DEFAULT_ZOME_NAME: string = "profiles";

  async getMyHandle(): Promise<string> {
    return this.call('get_my_handle', null);
  }
  async setMyHandle(value: string): Promise<EntryHash> {
    return this.callBlocking('set_my_handle', value);
  }
  async fetchAllHandles(): Promise<string[]> {
    return this.call('fetch_all_handles', null);
  }
}
```

#### Use

```typescript
/** HCL of the cell we want to use */
const hcl = new HCL("myHapp", "myRole");
/** Create AppProxy from provided local port */
const appProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
/** Map out all the runnings cells for a Role in a happ. Required before calling createCellProxy */
await appProxy.fetchCells(hcl);
/** Create a CellProxy for the "profiles" role */
const cellProxy = appProxy.createCellProxy(hcl);
/** Create ZomeProxy */
const zomeProxy = ProfileZomeProxy(cellProxy);
/** Call zome function on the "profiles" zome */
const handles = await zomeProxy.fetchAllHandles();
```
