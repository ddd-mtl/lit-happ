
mod get;
mod basic_callbacks;

extern crate zome_utils;

mod basic_functions;


use hdk::prelude::*;

#[hdk_extern]
fn get_zome_info(_:()) -> ExternResult<ZomeInfo> {
   return zome_info();
}


#[hdk_extern]
fn get_dna_info(_:()) -> ExternResult<DnaInfo> {
   return dna_info();
}


#[hdk_extern]
fn get_agent_entry_hash(_:()) -> ExternResult<AnyLinkableHash> {
   Ok(AnyLinkableHash::from(EntryHash::from(agent_info()?.agent_initial_pubkey)))
}