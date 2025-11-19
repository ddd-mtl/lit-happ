use hdk::prelude::*;
use tasker_model::*;
use zome_utils::*;


/// get an agent's latest handle
#[hdk_extern]
pub fn get_task_item(eh: EntryHash) -> ExternResult<Option<(TaskItem, bool)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   //debug!("get_task_item() called! - {}", eh);
   /// Get TaskItem
   let Ok(task_item) = zome_utils::get_typed_from_eh::<TaskItem>(eh.clone().into(), GetStrategy::Network)
   else {
      return Ok(None);
   };
   /// Lookup "Completed" link
   let links = get_links(LinkQuery::new(eh, TaskerLinkType::Completed.try_into_filter().unwrap()), GetStrategy::Network)?;
   //debug!("get_task_item() Completed.links.len = {}", links.len());
   /// Done
   Ok(Some((task_item, links.len() > 0)))
}


///
#[hdk_extern]
pub fn get_list_items(list_eh: EntryHash) -> ExternResult<Vec<(EntryHash, TaskItem, bool)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   //debug!("get_list_items() called !");
   //let list: TaskList = zome_utils::get_typed_from_eh(list_eh)?;
   let item_links = get_links(LinkQuery::new(list_eh.clone(), TaskerLinkType::Item.try_into_filter().unwrap()), GetStrategy::Network)?;
   //debug!("item_links() item_links.len = {}", item_links.len());
   let mut result = Vec::new();
   for link in item_links.into_iter() {
      let item_eh: EntryHash = EntryHash::try_from(link.target).expect("Should be an EntryHash");
      let Some((item, is_complete)) = get_task_item(item_eh.clone())?
      else {
         continue;
      };
      result.push((item_eh.clone(), item, is_complete));
   }
   //debug!("item_links() result = {:?}", result);
   Ok(result)
}


///
#[hdk_extern]
pub fn get_all_lists(strategy: GetStrategy) -> ExternResult<Vec<(EntryHash, TaskList)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("get_all_lists() called !");
   /// Get all TaskLists links
   let anchor = Path::from("lists").path_entry_hash()?;
   let links = get_links(LinkQuery::new(anchor.clone(), TaskerLinkType::TaskLists.try_into_filter().unwrap()), strategy)?;
   debug!("get_all_lists() {:?}", links);
   let link_pairs = get_typed_from_links::<TaskList>(
      LinkQuery::new(anchor, TaskerLinkType::TaskLists.try_into_filter().unwrap()),
      strategy,
   )?;
   debug!("get_all_lists() link_pairs.len() = {:?}", link_pairs.len());
   let list_pairs: Vec<(EntryHash, TaskList)> = link_pairs.into_iter().map(|(list, link)| {
      let list_eh: EntryHash = EntryHash::try_from(link.target).expect("Should be an EntryHash");
      (list_eh, list)
   }).collect();
   /// Done
   Ok(list_pairs)
}
