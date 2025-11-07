use hdk::prelude::*;
use integer_integrity::*;
use zome_signals::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
  Ok(InitCallbackResult::Pass)
}

///
#[hdk_extern(infallible)]
fn post_commit(signed_actions: Vec<SignedActionHashed>) {
  debug!("INTEGER post_commit() called for {} actions", signed_actions.len());
  attest_post_commit::<IntegerEntry, IntegerLinkType>(signed_actions);
}
