//use hdi::prelude::*;
use crate::*;

/// Protocol for notifying the ViewModel (UI) of system level events
#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
#[serde(tag = "type")]
pub enum SystemSignalProtocol {
    PostCommitNewStart {app_entry_type: String},
    PostCommitNewEnd {app_entry_type: String, succeeded: bool},
    PostCommitDeleteStart {app_entry_type: String},
    PostCommitDeleteEnd {app_entry_type: String, succeeded: bool},
    SelfCallStart {zome_name: String, fn_name: String},
    SelfCallEnd {zome_name: String, fn_name: String, succeeded: bool},
}

/// Protocol for notifying the ViewModel (UI)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ExampleSignalProtocol {
    System(SystemSignalProtocol),
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
    let signal = LitHappSignal {
        from: agent_info()?.agent_latest_pubkey,
        pulses: vec![ExampleSignalProtocol::System(sys)],
    };
    return emit_signal(&signal);
}

