#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;
use real_integrity::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  debug!("*** Label.init() callback - START");
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_real(eh: EntryHash) -> ExternResult<f32> {
  debug!("*** get_real() called");
  let res = get_entry(eh)?;
  let RealEntry::Real(real) = res else {
    return Err(WasmInnerGuest("Label not found"));
  };
  Ok(real.value)
}


#[hdk_extern]
fn create_real(value: f32)  -> ExternResult<EntryHash> {
  debug!("*** create_label() called");
  let entry = Real {value};
  let eh = hash_entry(entry.clone())?;
  let ah = create_entry(RealEntry::Real(entry))?;
  let link_ah = create_link(agent_info()?.agent_initial_key, eh, RealLink::Default, None)?;
  Ok(eh)
}



#[hdk_extern]
fn get_my_reals(_:()) -> ExternResult<Vec<f32>> {
  debug!("*** get_my_reals() called");
  let links = get_links(agent_info()?.agent_initial_key, RealLink::Default, None)?;
  let labels = links.into_iter().map(|link| {
      let name = get_real(link.target)?;
      return name;
  }).collect();
  Ok(labels)
}