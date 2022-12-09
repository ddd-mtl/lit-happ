# lit-happ

Builds on the [cell-proxy](https://www.npmjs.com/package/@ddd-qc/cell-proxy) package to provide a MVVM framework for building web-UI in [Lit](https://www.npmjs.com/package/lit) for [holochain](https://www.npmjs.com/package/@holochain/client) apps.


## Installing

```bash
npm i @ddd-qc/lit-happ
npm i @ddd-qc/cell-proxy
```

## Design

The Model-View-ViewModel ("MVVM") architectural pattern can be used for build holochain web apps by considering Holochain DNAs as the "Model" and LitElements as the "View".
What is missing is the "ViewModel", the categorie of objects that formats data from the model in a way that it can be consumed and updated by the view (without actually knowing the exact implementations of Views).
This package provides this categorie of objects.

To achieve this, the package makes use of Lit's reactive properties to perform the data-binding between the View and the ViewModel.
On the other end, the ViewModel makes use of `cell-proxy` to communicate with the Model.
[@lit-labs/context](https://www.npmjs.com/package/@lit-labs/context) is used to pass around the ViewModels to all the different `LitElements`.
This means that ViewModels are bound to a `ReactiveElement`.

The host `ReactiveElement` that holds the `ConductorAppProxy` **should** also hold the ViewModels and thus be the provider of those contexts.


### Perspective

A `Perspective` is the data set that a ViewModel presents to its client Views.
This name makes is clear that the data provided is always a slice of all the data available on the DHT.
This is to reflect that in holochain "no node can pretend to have the full truth at any moment".
The exact shape of a perspective is dependent on the ViewModel implementation for a DNA or Zome.


# API

On one side, the API defines the `ViewModel` abstract base class and abstract implementations for Zomes and Dnas.
On the other, it provides `LitElement` abstract subclasses that make uses of `ViewModel` for Zomes, Dnas and Happs. These `LitElement` subclasses are provided for faster development but are not mandatory for using `ViewModels`.

The package also provides these finalized `LitElements`:
 - `entry-defs-select`: A selector for picking an `EntryDef` from all the available ones in the current cell.
 - `cell-context`: Provide the `InstalledCell` context to its children. 
 - `view-cell-context`: Display the `InstalledCell` received from context (used for debugging)


## ViewModels

### ViewModel abstract base class

The `ViewModel` abstract base class implements the Observer design pattern:

```typescript
subscribe(providedHost: ReactiveControllerHost, propName: PropertyKey): void;
unsubscribe(candidat: ReactiveControllerHost): void;
protected notifySubscribers(): void;
```

Observers are `ReactiveControllerHost` who must provide the name of one of their reactive properties. 
The property will be automatically updated by the `ViewModel` when its private method `notifySubscribers()` is called.

**Subclasses are responsible for calling `this.notifySubscribers()` when their perspective has been updated.**

The `ViewModel` is retrievable via Context using the `ContextKey` defined by its private method `getContext()`.


### ZomeViewModel (zvm)

An abstract subclass of `ViewModel` designed to be inhereted for a Zome.
It is in relation with the `ZomeProxy` subclass for the same Zome.
This relation is set in the `ZOME_PROXY` static field.

On construction, the zvm will be bound to a cell and will create a ZomeProxy of the type defined by `ZOME_PROXY`.

The ZomeProxy's `DEFAULT_ZOME_NAME` will be used to define the Context for which we can find this ViewModel in order to avoid collisions in ZomeViewModel contexts, when you have multiple zomes in a DNA.
The cell's dnaHash is also used to avoid collisions in ZomeViewModel contexts when multiple DNAs use the same zome.

A zvm is free to define the type of its perspective.

All subclasses of `ZomeViewModel` **must** implement the following methods:
```typescript
get perspective(): any;
protected hasChanged(): boolean; // return true when the perspective has been updated. This will update the reactive properties of its observers.
get zomeProxy(): ZomeProxy; // should return its zomeProxy in its concrete type.
```


All subclasses of `ZomeViewModel` **can** implement the following methods:
```typescript
async probeAll(): Promise<void>; // Lets an observer trigger probing in the DHT in order to get an updated perspective
async initialProbe(): Promise<void>; // Define the probing to do at startup (should get data on source-chain only)
```

### DnaViewModel (dvm)

An abstract subclass of `ViewModel` designed to be inhereted for a DNA.
On construction, the dvm will be bound to a cell and create a zvm for each of its zome.
To make this possible a dvm **must** define the static field `ZVM_DEFS`, which is the list of its zvms.
To construct a dvm, a roleName must be provided. It will use the one define in its statif field `DEFAULT_BASE_ROLE_NAME` if none is provided as constructor argument.

A `ReactiveElement` holding a `DnaViewModel` must explicity subscribe to a dvm's zvm if it wants to be updated when the zvm's perspective changed. Otherwise, it will only receive updates from changes in the dvm's perspective. The dvm's perspective is **not** an agregate of its zvms perspectives.
The intent of the dvm is to provide data that is more than the sum of its zvms perspective.

The dvm's roleName is used to define the Context for which we can find this ViewModel.

The `DNA_MODIFIERS` static field can be set to define Role-specific dvms.

The zvm of one of its zomes can be retrieved by calling:
`getZomeViewModel(zomeName)`

A dvm is free to define the type of its perspective.

All subclasses of `DnaViewModel` **must** implement the following methods:
```typescript
get perspective(): any;
protected hasChanged(): boolean; // return true when the perspective has been updated. This will update the reactive properties of its observers.
```

All subclasses of `DnaViewModel` **can** implement the following members:
```typescript
signalHandler?: AppSignalCb; // The handler called when a signal for this cell is received
```

`probeAll()` and `initialProbe()` do not need to be overriden since by default they will call the respective method on all its zvms.


### HappViewModel (hvm)

The `HappViewModel`represents the ViewModel of a happ, but is not actually a subclass of `ViewModel` and thus does not hold a 
`perspective`. 
The intent of a `HappViewModel` is to create and store all the `DnaViewModels` for a happ, in an aggregate way.

A `ReactiveElement` holding a `HappViewModel` must explicity subscribe to the `DnaViewModels` it wants to receive updates from.

A hvm requires a `HvmDef` to be constructed.
A `HvmDef` is a rough translation of an AppManifest, but it associates each role to a `DnaViewModel`. Example:
```typescript
const playgroundDef: HvmDef = {
    id: "playground-app",
    dvmDefs: [
      {
        ctor: ProfilesDvm,
        isClonable: false,
      },
      {
        ctor: ChatChannelDvm,
        isClonable: true,
      }
    ],
}
```

On construction, the hvm will use the provided `ConductorAppProxy` and create a dvm for each one defined in the `HvmDef`, and bind them to the provided `ReactiveElement`.
It will store the `HvmDef` so as to be able to create clones when requested.

`HappViewModel` provides an API for retrieving dvms:
```typescript
getDvm(hclOrId: HCL | RoleInstanceId): DnaViewModel | undefined;
getClones(baseRoleName: BaseRoleName): DnaViewModel[];
getCellDvms(cellId: CellId): Dictionary<DnaViewModel> | undefined;
```


`HappViewModel` provides an API for creating dvms for clones: `async cloneDvm(baseRoleName: BaseRoleName, cellDef?: CellDef)`

```typescript
interface CellDef {
  modifiers: DnaModifiersOptions,
  membraneProof?: MembraneProof,
  cloneName?: string,
}
```

As with `DnaViewModel`, `probeAll()` and `initialProbe()` are implemented and will call the respective method on all its dvms.




### Views

The following abstract base classes are provided for easily building Views for your own zomes and DNAs.

### ZomeElement

A `ZomeElement` is an abstract subclass of a `LitElement` bound to a concrete `ZomeViewModel` and its perspective type.

it has a reactive property holding an `installedCell`, and a reactive property for its zvm's perspective: `this.perspective`.
The zvm itself is stored in the `this._zvm` field.

On first update, it will request the zvm for its cell from context.
The element will not render as long as it hasn't found a zvm from context.

If the installedCell property changes value, it will automatically fetch the zvm for this new cell.
When this happens `zvmUpdated()` is called, meaning subclasses can override this method if they want init and deinit things based on the zvm. 

With this implementation, in your subclass you can directly use the zvm's perspective within `render()`.


### DnaElement

A `DnaElement` is an abstract subclass of a `LitElement` bound to a concrete `DnaViewModel` and its perspective type.

it has reactive property holding an `installedCell`, and a reactive property for its dvm's perspective: `this.perspective`.
the dvm itself is stored in the `_dvm` field.

On first update, it will request the dvm for its cell from context.
The element will not render as long as it hasn't found a dvm from context.

If the installedCell property changes value, it will automatically fetch the dvm for this new cell.
When this happens `dvmUpdated()` is called, meaning subclasses can override this method if they want init and deinit things based on the dvm.

With this implementation, in your subclass you can directly use the dvm's perspective within `render()`.


### HappElement

A `HappElement` is an abstract subclass of a `LitElement` bound to a `HvmDef` defined in the static field `HVM_DEF`.
It creates and holds a `ConductorAppProxy` and `HappViewModel` based on `HVM_DEF`.

On construction, it will create the `ConductorAppProxy` and `HappViewModel` based on its static

It will only render once the hvm has been built.
Once the hvm is built, it will call `this.happInitialized()`, meaning a subclass can override this method and do whatever it needs to do at startup with the hvm.

Subclasses are encourage to define getters for directly accessing the happ's dvms.
Example:
`get profilesDvm(): ProfilesDvm { return this.hvm.getDvm(ProfilesDvm.DEFAULT_BASE_ROLE_NAME)! as ProfilesDvm }`


## Example

Define reactive property for the ViewModels in the LitElement:
```typescript
  @property({type: Object, attribute: false)
  profilesPerspective!: ProfilesPerspective;
```

Initialize the Happ UI:
```typescript
init() {
  /** Create AppProxy from provided local port */
  this._conductorAppProxy = await ConductorAppProxy.new(Number(process.env.HC_PORT));
  /** Create HappViewModel from definition and AppProxy. Does the initial probe in background */   
  this._hvm = await HappViewModel.new(this, this._conductorAppProxy, playgroundDef);
  /** Grab the profiles ZomeViewModel */
  const profileZvm = (this._hvm.getDvm(ProfilesDvm.DEFAULT_ROLE_ID)! as ProfilesDvm).profilesZvm;
  const me = profileZvm.perspective.myProfile;
  console.log({me});
  /** Subscribe to updates from the "profiles" ZomeViewModel and bind it to a reactive property */
  profileZvm.subscribe(this, "profilesPerspective");   
}
```


Render the Happ UI and make use of the data provided by the ViewModel
```typescript
render() {
  return html`<h3>${this.profilesPerspective.myProfile.name}</h3>`;
}
```


## Implementation

To make full use of the framework, a DNA developer should implement:
 - A `ZomeProxy` subclass for each zome in the DNA (and input & output type bindings from Rust).
 - A `ZomeViewModel` subclass for each zome in the DNA, and its respective perspective type.
 - A `DnaViewModel` subclass for their DNA and its respective perspective type.

 A developer could also provide abstract subclasses to `ZomeElement` and `DnaElement` which add specific code for using their DNA.

An example implementation of all the subclasses is available in the github repo under `/example`.
