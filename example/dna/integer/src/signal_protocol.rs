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
pub enum ExampleSignalProtocol {
    //System(SystemSignalProtocol),
    Custom(String),
}


#[derive(Clone, Debug, Serialize, Deserialize, SerializedBytes)]
pub struct SystemSignal {
    pub System: SystemSignalProtocol,
}


#[derive(Clone, Debug, Serialize, Deserialize, SerializedBytes)]
pub struct LitHappSignal {
    pub from: AgentPubKey,
    pub pulses: Vec<ExampleSignalProtocol>,
}


///
pub fn emit_self_signal(signal: ExampleSignalProtocol) -> ExternResult<()> {
    let signal = LitHappSignal {
        from: agent_info()?.agent_latest_pubkey,
        pulses: vec![signal],
    };
    return emit_signal(&signal);
}


///
pub fn emit_system_signal(sys: SystemSignalProtocol) -> ExternResult<()> {
    let signal = SystemSignal {
        System: sys,
    };
    return emit_signal(&signal);
}
