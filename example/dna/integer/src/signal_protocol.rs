//use hdi::prelude::*;
use crate::*;

/// Protocol for notifying the ViewModel (UI) of system level events
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum SystemSignalProtocol {
    PostCommitStart {entry_type: String},
    PostCommitEnd {entry_type: String, succeeded: bool},
    SelfCallStart {zome_name: String, function_name: String},
    SelfCallEnd {zome_name: String, function_name: String, succeeded: bool},
}

/// Protocol for notifying the ViewModel (UI)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SignalProtocol {
    System(SystemSignalProtocol),
    Custom(String),
}


#[derive(Clone, Debug, Serialize, Deserialize, SerializedBytes)]
pub struct LitHappSignal {
    pub from: AgentPubKey,
    pub signal: SignalProtocol,
}


///
pub fn emit_self_signal(signal: SignalProtocol) -> ExternResult<()> {
    let signal = LitHappSignal {
        from: agent_info()?.agent_latest_pubkey,
        signal: signal,
    };
    return emit_signal(&signal);
}
