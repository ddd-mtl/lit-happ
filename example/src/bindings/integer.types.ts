/* This file is generated by zits. Do not edit manually */

import {
WebsocketConnectionOptions,
/** types.ts */
HoloHash,
AgentPubKey,
DnaHash,
WasmHash,
EntryHash,
ActionHash,
AnyDhtHash,
ExternalHash,
KitsuneAgent,
KitsuneSpace,
HoloHashB64,
AgentPubKeyB64,
DnaHashB64,
WasmHashB64,
EntryHashB64,
ActionHashB64,
AnyDhtHashB64,
InstalledAppId,
Signature,
CellId,
DnaProperties,
RoleName,
InstalledCell,
Timestamp,
Duration,
HoloHashed,
NetworkInfo,
FetchPoolInfo,
/** hdk/action.ts */
SignedActionHashed,
RegisterAgentActivity,
ActionHashed,
ActionType,
Action,
NewEntryAction,
Dna,
AgentValidationPkg,
InitZomesComplete,
CreateLink,
DeleteLink,
OpenChain,
CloseChain,
Update,
Delete,
Create,
/** hdk/capabilities.ts */
CapSecret,
CapClaim,
GrantedFunctionsType,
GrantedFunctions,
ZomeCallCapGrant,
CapAccessType,
CapAccess,
CapGrant,
///** hdk/countersigning.ts */
//CounterSigningSessionData,
//PreflightRequest,
//CounterSigningSessionTimes,
//ActionBase,
//CounterSigningAgents,
//PreflightBytes,
//Role,
//CountersigningAgentState,
/** hdk/dht-ops.ts */
DhtOpType,
DhtOp,
getDhtOpType,
getDhtOpAction,
getDhtOpEntry,
getDhtOpSignature,
/** hdk/entry.ts */
EntryVisibility,
AppEntryDef,
EntryType,
EntryContent,
Entry,
/** hdk/record.ts */
Record as HcRecord,
RecordEntry as HcRecordEntry,
/** hdk/link.ts */
AnyLinkableHash,
ZomeIndex,
LinkType,
LinkTag,
RateWeight,
RateBucketId,
RateUnits,
Link,
/** api/admin/types.ts */
InstalledAppInfoStatus,
DeactivationReason,
DisabledAppReason,
StemCell,
ProvisionedCell,
ClonedCell,
CellType,
CellInfo,
AppInfo,
MembraneProof,
FunctionName,
ZomeName,
ZomeDefinition,
IntegrityZome,
CoordinatorZome,
DnaDefinition,
ResourceBytes,
ResourceMap,
CellProvisioningStrategy,
CellProvisioning,
DnaVersionSpec,
DnaVersionFlexible,
AppRoleDnaManifest,
AppRoleManifest,
AppManifest,
AppBundle,
AppBundleSource,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
/** Common */
DhtOpHashB64,
//DnaHashB64, (duplicate)
//AnyDhtHashB64, (duplicate)
DhtOpHash,
/** DnaFile */
DnaFile,
DnaDef,
Zomes,
WasmCode,
/** entry-details */
EntryDetails,
RecordDetails,
Details,
DetailsType,
EntryDhtStatus,
/** Validation */
ValidationStatus,
ValidationReceipt,
   } from '@holochain-open-dev/core-types';

/** Protocol for notifying the ViewModel (UI) of system level events */
export type SystemSignalProtocolVariantPostCommitNewStart = {
  type: "PostCommitNewStart"
  app_entry_type: string
}
export type SystemSignalProtocolVariantPostCommitNewEnd = {
  type: "PostCommitNewEnd"
  app_entry_type: string
  succeeded: boolean
}
export type SystemSignalProtocolVariantPostCommitDeleteStart = {
  type: "PostCommitDeleteStart"
  app_entry_type: string
}
export type SystemSignalProtocolVariantPostCommitDeleteEnd = {
  type: "PostCommitDeleteEnd"
  app_entry_type: string
  succeeded: boolean
}
export type SystemSignalProtocolVariantSelfCallStart = {
  type: "SelfCallStart"
  zome_name: string
  fn_name: string
}
export type SystemSignalProtocolVariantSelfCallEnd = {
  type: "SelfCallEnd"
  zome_name: string
  fn_name: string
  succeeded: boolean
}
export type SystemSignalProtocol =
  | SystemSignalProtocolVariantPostCommitNewStart
  | SystemSignalProtocolVariantPostCommitNewEnd
  | SystemSignalProtocolVariantPostCommitDeleteStart
  | SystemSignalProtocolVariantPostCommitDeleteEnd
  | SystemSignalProtocolVariantSelfCallStart
  | SystemSignalProtocolVariantSelfCallEnd;

/** Protocol for notifying the ViewModel (UI) */
export enum ExampleSignalProtocolType {
	System = 'System',
	Custom = 'Custom',
}
export type ExampleSignalProtocolVariantSystem = {System: SystemSignalProtocol}
export type ExampleSignalProtocolVariantCustom = {Custom: string}
export type ExampleSignalProtocol = 
 | ExampleSignalProtocolVariantSystem | ExampleSignalProtocolVariantCustom;

export interface SystemSignal {
  System: SystemSignalProtocol
}

export interface LitHappSignal {
  from: AgentPubKey
  pulses: ExampleSignalProtocol[]
}

/**  */
export interface Integer {
  value: number
}

export enum IntegerEntryType {
	Integer = 'Integer',
}
export type IntegerEntryVariantInteger = {Integer: Integer}
export type IntegerEntry = 
 | IntegerEntryVariantInteger;
