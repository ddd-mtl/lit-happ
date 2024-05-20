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
    let (_eh, entry_type2) = action.entry_data().unwrap();
    match entry_type2 {
      EntryType::AgentPubKey => {},
      EntryType::CapClaim => {},
      EntryType::CapGrant => {},
      EntryType::App(_app_entry_def) => {
        let variant_name = "Integer".to_owned();
        let _ = emit_signal(&SignalProtocol::System(SystemSignalProtocol::PostCommitStart { entry_type: variant_name.clone()}));
        let _ = emit_signal(&SignalProtocol::System(SystemSignalProtocol::PostCommitEnd {entry_type: variant_name, succeeded: true}));
      },
    }
  }
}
