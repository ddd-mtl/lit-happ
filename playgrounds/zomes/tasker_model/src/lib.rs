mod validate;

use hdi::prelude::*;

/// List of all Entry types handled by this Zome
#[hdk_entry_types]
#[unit_enum(TaskerEntryTypes)]
#[derive(Serialize, Deserialize, SerializedBytes, Clone)]
pub enum TaskerEntry {
   #[entry_type(required_validations = 3, visibility = "public")]
   TaskList(TaskList),
   #[entry_type(required_validations = 3, visibility = "public")]
   TaskItem(TaskItem),
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct TaskList {
   pub title: String,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskItem {
   pub title: String,
   pub assignee: AgentPubKey,
   pub list_eh: EntryHash, // to TaskList
}


/// List of all Link types handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum TaskerLinkType {
   Default,
   Path,
   TaskLists,
   Locked,  /// RoleClaim EntryHash in Tag
   Completed,
   Item,
}
