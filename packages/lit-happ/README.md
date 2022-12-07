# lit-happ

Builds on the `cell-proxy` package to provide a MVVM framework for building web-UI in Lit for holochain apps.


## Installing

```bash
npm i @ddd-qc/lit-happ
```

## Design

Model-View-ViewModel where:
 - Model: holochain DNAs
 - View: LitElements
 - ViewModel: subclasses of this package `ViewModel`

In this architectural pattern, the ViewModel, while being unaware of the exact implements of the Views, makes the data from the Model available and in a usable/presentable form by the Views.

This package makes use of Lit's reactive properties to perform the data-binding between the View and the ViewModel.
On the other end, the ViewModel makes use of `cell-proxy` to communicate with the Model.
`lit-context` is used to pass around the ViewModels to all the different `LitElements`.

The host Element, that holds the `ConductorAppProxy` is the main provider of those contexts.


### Perspective

A `Perspective` is the set of data that a ViewModel presents to its client Views.
This name makes is clear that the App never pretends to have a full picture of the data available on the DHT.
The exact shape of a perspective is dependent on the ViewModel implementation for a DNA or Zome.

## API

On one side, the API defines a `ViewModel` abstract base class and abstract implementations for Zomes and Dnas.
On the other, it provides `LitElement` abstract subclasses that make uses of `ViewModel` for Zomes, Dnas and Happs.
Finaly it provides two useful `LitElement`:
 - `cell-context`: Provide the installed cell context to its children.
 - `entry-defs-select`: A selector for picking an entryDef in the current cell. 

### ViewModel Definition

A Happ 

### HappViewModel

Although not actually a subclass of `ViewModel` and thus does not hold a `perspective`, the `HappViewModel`represents the ViewModel of a happ.
A `HappViewModel` is the aggregate of all the `DnaViewModel`s used by the happ.
A `ReactiveElement` holding a `HappViewModel` must explicity subscribe to the `DnaViewModel`s it wants to receive updates from.
It creates and stores all the DnaViewModels from the happ definition.

A Happ definition is roughly a translation of the AppManifest, but it associates each role to a DnaViewModel. Example:
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

## Example use

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
  /** Create HappViewModel from definition and AppProxy */   
  this._hvm = await HappViewModel.new(this, this._conductorAppProxy, playgroundDef);
  await this._hvm.probeAll();
  const profileZvm = (this._hvm.getDvm(ProfilesDvm.DEFAULT_ROLE_ID)! as ProfilesDvm).profilesZvm;
  const me = await profileZvm.probeProfile(profileZvm.agentPubKey);
  console.log({me});
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

To make full use of the framework, a DNA developer must implement:
 - A `ZomeProxy` subclass for each of their zome (and input&output type bindings from Rust).
 - A `ZomeViewModel` subclass for each of their zome, and its respective perspective type
 - A `DnaViewModel` subclass for their DNA and its respective perspective type.

 A developer could also provide abstract subclasses to `ZomeElement` and `DnaElement` which add specific code for using their DNA.
