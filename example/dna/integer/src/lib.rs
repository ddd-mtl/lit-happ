#![allow(non_snake_case)]

use hdk::prelude::*;
use integer_integrity::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_integer(ah: ActionHash) -> ExternResult<u32> {
  debug!("*** get_integer() called");
  let Some(record) = get(ah, GetOptions::network())? else {
    return Err(wasm_error!(WasmErrorInner::Guest("Integer not found".to_string())));
  };
  let RecordEntry::Present(entry) = record.entry() else {
    return Err(wasm_error!(WasmErrorInner::Guest("Integer not found".to_string())));
  };
  let integer = Integer::try_from(entry.clone())?;
  Ok(integer.value)
}


#[hdk_extern]
fn create_integer(value: u32) -> ExternResult<ActionHash> {
  debug!("*** create_integer() called");
  let entry = Integer {value};
  let _eh = hash_entry(entry.clone())?;
  let ah = create_entry(IntegerEntry::Integer(entry))?;
  let _link_ah = create_link(agent_info()?.agent_initial_pubkey, ah.clone(), IntegerLinkType::Default, LinkTag::from(()))?;

  let payload = "I like integers";
  debug!("emit_signal() {:?}", payload);
  emit_signal(payload)?;

  Ok(ah)
}


#[hdk_extern]
fn get_my_values_local(_:()) -> ExternResult<Vec<(ActionHash, u32)>> {
  debug!("*** get_my_values_local()");
  // Get all Create Integer actions with query
  let query_args = ChainQueryFilter::default()
    .include_entries(true)
    .action_type(ActionType::Create)
    .entry_type(IntegerEntryTypes::Integer.try_into().unwrap());
  let records = query(query_args)?;
  // Get typed entry for all results
  let mut numbers = Vec::new();
  for record in records {
    let RecordEntry::Present(entry) = record.entry() else {
      return Err(wasm_error!(WasmErrorInner::Guest("Could not convert record".to_string())));
    };
    let number = Integer::try_from(entry.clone()).unwrap();
    numbers.push((record.action_address().to_owned(), number.value))
  }
  Ok(numbers)
}


#[hdk_extern]
fn get_my_values(_:()) -> ExternResult<Vec<(ActionHash, u32)>> {
  debug!("*** get_my_values()");
  let links = get_links(GetLinksInputBuilder::try_new(agent_info()?.agent_initial_pubkey, IntegerLinkType::Default).unwrap().build())?;
  let numbers = links.into_iter().map(|link| {
    let ah: ActionHash = link.target.into_action_hash().unwrap();
    let value = get_integer(ah.clone()).unwrap();
    return (ah, value);
  }).collect();
  Ok(numbers)
}


#[hdk_extern]
fn get_my_values_incremental(knowns: Vec<ActionHash>) -> ExternResult<Vec<(ActionHash, u32)>> {
  debug!("*** get_my_values_incremental(): knowns = {:?}", knowns);
  let links = get_links(GetLinksInputBuilder::try_new(agent_info()?.agent_initial_pubkey, IntegerLinkType::Default).unwrap().build())?;
  let ahs: Vec<ActionHash> = links.into_iter()
    .map(|link| link.target.into_action_hash().unwrap())
    .filter(|item| !knowns.contains(item))
    .collect();
  debug!("*** get_my_values_incremental(): ahs = {:?}", ahs);
  let numbers = ahs.into_iter().map(|ah| {
    let value = get_integer(ah.clone()).unwrap();
    return (ah, value);
  }).collect();
  Ok(numbers)
}


#[hdk_extern]
fn get_zome_info(_:()) -> ExternResult<ZomeInfo> {
  return zome_info();
}


#[hdk_extern]
fn get_dna_info(_:()) -> ExternResult<DnaInfo> {
  return dna_info();
}
