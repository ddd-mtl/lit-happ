use hdi::prelude::*;


///
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
   //debug!("*** membranes.validate() op = {:?}", op);
   match op {
      Op::CreateRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::CreateEntry(create_entry) => {
         let entry = create_entry.entry;
         let actual_action = create_entry.action.hashed.into_inner().0;
         return validate_entry(entry, actual_action.entry_type());
      },
      Op::CreateLink(create_link_op) => {
         return validate_create_link(create_link_op.create_link);
      },
      Op::DeleteLink (_)=> Ok(ValidateCallbackResult::Invalid("Deleting links isn't allowed".to_string())),
      Op::Update ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::Delete ( _ ) => Ok(ValidateCallbackResult::Invalid("Deleting entries isn't allowed".to_string())),
      Op::AgentActivity ( _ ) => Ok(ValidateCallbackResult::Valid),
   }
}


///
pub fn validate_entry(entry: Entry, maybe_entry_type: Option<&EntryType>) -> ExternResult<ValidateCallbackResult> {
   /// Determine where to dispatch according to base
   let result = match entry.clone() {
      Entry::CounterSign(_data, _bytes) => Ok(ValidateCallbackResult::Invalid("CounterSign not allowed".into())),
      Entry::Agent(_agent_key) => Ok(ValidateCallbackResult::Valid),
      Entry::CapClaim(_claim) => Ok(ValidateCallbackResult::Valid),
      Entry::CapGrant(_grant) => Ok(ValidateCallbackResult::Valid),
      Entry::App(_entry_bytes) => {
         let EntryType::App(app_entry_def) = maybe_entry_type.unwrap()
            else { unreachable!() };
         let entry_def_index = validate_app_entry(app_entry_def.entry_index(), entry);
         entry_def_index
      },
   };
   /// Done
   //debug!("*** validate_entry() result = {:?}", result);
   result
}


///
#[allow(unreachable_patterns)]
//pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry_bytes: AppEntryBytes)
pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, _entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   debug!("*** validate_app_entry() callback called!");
   return match entry_def_index.into() {
      0 => Ok(ValidateCallbackResult::Valid),
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


/// Validation sub callback
pub fn validate_create_link(signed_create_link: SignedHashed<Action>)
   -> ExternResult<ValidateCallbackResult>
{
   let action = signed_create_link.hashed.into_inner().0;
   let ActionData::CreateLink(create_link) = action.data else {
      return Ok(ValidateCallbackResult::Invalid("Expected a CreateLink action".to_string()));
   };
   let tag_str = String::from_utf8_lossy(&create_link.tag.0);
   debug!("*** `validate_create_link({:?})` called | {:?}:{}", create_link, create_link.link_type, tag_str);

   Ok(ValidateCallbackResult::Valid)
}
