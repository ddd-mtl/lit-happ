use hdk::prelude::*;
use tasker_model::*;

#[hdk_extern]
pub fn create_task_list(title: String) -> ExternResult<ActionHash> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let entry =TaskerEntry::TaskList(TaskList {title});
   let eh = hash_entry(entry.clone())?;
   let ah = create_entry(entry)?;
   let anchor_eh = Path::from("lists")
      .path_entry_hash()
      .expect("TaskLists Path should hash");
   let link_ah = create_link(
      anchor_eh,
      eh.clone(),
      TaskerLinkType::TaskLists,
      LinkTag::from(()),
   )?;
   debug!("create_task_list() link_ah = {link_ah}");

   let anchor_eh2 = Path::from("foo.2:3#barbazii")
     .path_entry_hash()
     .expect("TaskLists Path should hash");

   /// Create complexe path for testing reasons
   let _link_ah2 = create_link(
      anchor_eh2,
      eh.clone(),
      TaskerLinkType::TaskLists,
      LinkTag::from(()),
   )?;

   let path4 = Path::from("foo.2:3#barbazii").typed(TaskerLinkType::Path)?;
   let link_ah2 = create_link(
      path4.path_entry_hash()?,
      ah.clone(),
      TaskerLinkType::TaskLists,
      LinkTag::from(()),
   )?;


   debug!("create_task_list() link_ah2 = {link_ah2}");

   /// Done
   Ok(ah)
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskItemInput {
   pub title: String,
   pub assignee: AgentPubKey,
   pub list_eh: EntryHash,
}

#[hdk_extern]
pub fn create_task_item(input: CreateTaskItemInput) -> ExternResult<ActionHash> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let taskItem = TaskItem {title: input.title, assignee: input.assignee, list_eh: input.list_eh.clone() };
   let entry = TaskerEntry::TaskItem(taskItem);
   let eh = hash_entry(entry.clone())?;
   let ah = create_entry(entry)?;
   let _ = create_link(
      input.list_eh,
      eh.clone(),
      TaskerLinkType::Item,
      LinkTag::from(()),
   )?;
   Ok(ah)
}


// TODO
//
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct ReassignTaskInput {
//    pub task_eh: EntryHash,
//    pub assignee: AgentPubKey,
// }
//
// #[hdk_extern]
// pub fn reassign_task(input: ReassignTaskInput) -> ExternResult<ActionHash> {
//    std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
//    let item = zome_utils::get_typed_from_eh::<TaskItem>(input.task_eh.clone())?; // FIXME should get latest and not content
//    let newItem = TaskItem {title: item.title, assignee: input.assignee, list_eh: item.list_eh};
//    let res = update_entry(input.task_eh.into(), TaskerEntry::TaskItem(newItem))?;
//    Ok(res)
// }


#[hdk_extern]
pub fn complete_task(task_eh: EntryHash) -> ExternResult<ActionHash> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let anchor_eh = Path::from("completed")
      .path_entry_hash()
      .expect("completed path should hash");
   let link_ah = create_link(
      task_eh,
      anchor_eh,
      TaskerLinkType::Completed,
      LinkTag::from(()),
   )?;
   Ok(link_ah)
}


// #[hdk_extern]
// pub fn lock_task_list(list_eh: EntryHash) -> ExternResult<ActionHash> {
//    std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
//    debug!("lock_task_list() CALLED");
//    let anchor_eh = Path::from("locked")
//       .path_entry_hash()
//       .expect("completed path should hash");
//    let link_ah = create_link(
//       list_eh,
//       anchor_eh,
//       TaskerLinkType::Locked,
//       LinkTag::from(()),
//    )?;
//    Ok(link_ah)
// }


#[hdk_extern]
fn is_list_locked(list_eh: EntryHash) -> ExternResult<bool> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let locked_links = get_links(LinkQuery::new(list_eh.clone(), TaskerLinkType::Locked.try_into_filter().unwrap()), GetStrategy::Network)?;
   Ok(locked_links.len() > 0)
}
