use hdk::prelude::*;
use crate::*;

///
#[hdk_extern(infallible)]
fn post_commit(signedActionList: Vec<SignedActionHashed>) {
  debug!("INTEGER post_commit() called for {} actions", signedActionList.len());
  // Process each Action
  for sah in signedActionList {
    //debug!(" - {}", sah.action());
    let action = sah.action();
    if action.entry_type().is_none() {
      continue;
    }
    let (_eh, entry_type) = action.entry_data().unwrap();
    match entry_type {
      EntryType::AgentPubKey => {},
      EntryType::CapClaim => {},
      EntryType::CapGrant => {},
      EntryType::App(_app_entry_def) => {
        let variantName = "Integer".to_owned();
        let _ = emit_signal(&SignalProtocol::System(SystemSignalProtocol::PostCommitStart(variantName.clone())));
        let _ = emit_signal(&SignalProtocol::System(SystemSignalProtocol::PostCommitEnd((variantName, true))));
      },
    }
  }
}
