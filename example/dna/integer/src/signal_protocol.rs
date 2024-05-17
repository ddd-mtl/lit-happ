//use hdi::prelude::*;
use crate::*;

/// Protocol for notifying the ViewModel (UI) of system level events
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SystemSignalProtocol {
    PostCommitStart(String), // EntryType
    PostCommitEnd((String, bool)), // EntryType, Succeedded
    SelfCallStart((String, String)), // ZomeName, FunctionName
    SelfCallEnd((String, String, bool)), // ZomeName, FunctionName, Succeedded
}

/// Protocol for notifying the ViewModel (UI)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum SignalProtocol {
    System(SystemSignalProtocol),
}
