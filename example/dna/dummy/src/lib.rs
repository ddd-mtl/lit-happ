#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdk::prelude::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  debug!("*** Dummy.init() callback - START");
  Ok(InitCallbackResult::Pass)
}


#[hdk_extern]
fn get_dummy(_:()) -> ExternResult<()> {
  debug!("*** get_dummy() called");
  Ok(())
}
