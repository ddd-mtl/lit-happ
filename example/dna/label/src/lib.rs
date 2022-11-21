#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;
use label_integrity::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  debug!("*** Label.init() callback - START");
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_label(eh: EntryHash) -> ExternResult<u32> {
  debug!("*** get_label() called");
  let res = get_entry(eh)?;
  let LabelEntry::Label(label) = res else {
    return Err(WasmInnerGuest("Label not found"));
  };
  Ok(label.name)
}


#[hdk_extern]
fn create_label(name: String)  -> ExternResult<EntryHash> {
  debug!("*** create_label() called");
  let entry = Label {name};
  let eh = hash_entry(entry.clone())?;
  let ah = create_entry(LabelEntry::Label(entry))?;
  let link_ah = create_link(agent_info()?.agent_initial_key, eh, LabelLink::Default, None)?;
  Ok(eh)
}



#[hdk_extern]
fn get_my_labels(_:()) -> ExternResult<Vec<String>> {
  debug!("*** get_my_labels() called");
  let links = get_links(agent_info()?.agent_initial_key, LabelLink::Default, None)?;
  let labels = links.into_iter().map(|link| {
      let name = get_label(link.target)?;
      return name;
  }).collect();
  Ok(labels)
}