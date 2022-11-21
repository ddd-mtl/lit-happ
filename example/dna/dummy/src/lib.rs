#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;
use dummy_integrity::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  debug!("*** Dummy.init() callback - START");
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_dummy(eh: EntryHash) -> ExternResult<u32> {
  debug!("*** get_dummy() called");
  let res = get_entry(eh)?;
  let DummyEntry::Dummy(dummy) = res else {
    return Err(WasmInnerGuest("Dummy not found"));
  };
  Ok(dummy.value)
}


#[hdk_extern]
fn create_dummy(value: u32)  -> ExternResult<EntryHash> {
  debug!("*** create_dummy() called");
  let entry = Dummy {value};
  let eh = hash_entry(entry.clone())?;
  let ah = create_entry(DummyEntry::Dummy(entry))?;
  let link_ah = create_link(agent_info()?.agent_initial_key, eh, DummyLinkType::Default, None)?;
  Ok(eh)
}



#[hdk_extern]
fn get_my_dummies(_:()) -> ExternResult<Vec<u32>> {
  debug!("*** get_my_dummies() called");
  let links = get_links(agent_info()?.agent_initial_key, DummyLinkType::Default, None)?;
  let dummies = links.into_iter().map(|link| {
      let value = get_dummy(link.target)?;
      return value;
  }).collect();
  Ok(dummies)
}