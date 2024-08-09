use hdk::prelude::*;
use real_integrity::*;


#[hdk_extern]
fn get_zome_info(_:()) -> ExternResult<ZomeInfo> {
  return zome_info();
}


#[hdk_extern]
fn get_dna_info(_:()) -> ExternResult<DnaInfo> {
  return dna_info();
}

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  debug!("*** Label.init() callback - START");
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_real(eh: EntryHash) -> ExternResult<f32> {
  debug!("*** get_real() called");
  let Some(record) = get(eh, GetOptions::network())? else {
    return Err(wasm_error!(WasmErrorInner::Guest("Entry not found".to_string())));
  };
  let RecordEntry::Present(entry) = record.entry() else {
    return Err(wasm_error!(WasmErrorInner::Guest("Entry not found".to_string())));
  };
  let real = Real::try_from(entry.clone())?;
  Ok(real.value)
}


#[hdk_extern]
#[feature(zits_blocking)]
fn create_real(value: f32)  -> ExternResult<EntryHash> {
  debug!("*** create_label() called");
  let entry = Real {value};
  let eh = hash_entry(entry.clone())?;
  let _ah = create_entry(RealEntry::Real(entry))?;
  let _link_ah = create_link(agent_info()?.agent_initial_pubkey, eh.clone(), RealLink::Default, LinkTag::from(()))?;

  let start = sys_time()?;
  let mut payload = "I hate floats".to_string();
  debug!("emit_signal() {:?} | {:?}", payload, start);
  emit_signal(payload.clone())?;
  let mut diff = 0;
  while diff < 2 * 1000 {
    diff = (sys_time()? - start).unwrap().num_milliseconds();
    payload.push('s');
  }
  debug!("create_real() Done: {:?}", start);
  /// Done
  Ok(eh)
}



#[hdk_extern]
fn get_my_reals(_:()) -> ExternResult<Vec<f32>> {
  debug!("*** get_my_reals() called");
  let links = get_links(GetLinksInputBuilder::try_new(agent_info()?.agent_initial_pubkey, RealLink::Default).unwrap().build())?;
  let labels = links.into_iter().map(|link| {
      let name = get_real(link.target.into_entry_hash().unwrap()).unwrap();
      return name;
  }).collect();
  Ok(labels)
}
