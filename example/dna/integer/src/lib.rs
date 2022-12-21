#![allow(non_snake_case)]

use hdk::prelude::*;
use integer_integrity::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_integer(eh: EntryHash) -> ExternResult<u32> {
  debug!("*** get_integer() called");
  let Some(record) = get(eh, GetOptions::content())? else {
    return Err(wasm_error!(WasmErrorInner::Guest("Integer not found".to_string())));
  };
  let record::RecordEntry::Present(entry) = record.entry() else {
    return Err(wasm_error!(WasmErrorInner::Guest("Integer not found".to_string())));
  };
  let integer = Integer::try_from(entry.clone())?;
  Ok(integer.value)
}


#[hdk_extern]
fn create_integer(value: u32) -> ExternResult<EntryHash> {
  debug!("*** create_integer() called");
  let entry = Integer {value};
  let eh = hash_entry(entry.clone())?;
  let _ah = create_entry(IntegerEntry::Integer(entry))?;
  let _link_ah = create_link(agent_info()?.agent_initial_pubkey, eh.clone(), IntegerLinkType::Default, LinkTag::from(()))?;

  let payload = "I like integers";
  debug!("emit_signal() {:?}", payload);
  emit_signal(payload)?;

  Ok(eh)
}



#[hdk_extern]
fn get_my_values(_:()) -> ExternResult<Vec<u32>> {
  debug!("*** get_my_values() called");
  let links = get_links(agent_info()?.agent_initial_pubkey, IntegerLinkType::Default, None)?;
  let dummies = links.into_iter().map(|link| {
      let value = get_integer(link.target.into()).unwrap();
      return value;
  }).collect();
  Ok(dummies)
}
