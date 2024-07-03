use hdi::prelude::*;


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Real {
   pub value: f32,
}


#[hdk_entry_types]
#[unit_enum(RealEntryTypes)]
pub enum RealEntry {
   #[entry_type(required_validations = 3, visibility = "public")]
   Real(Real),
}



#[hdk_link_types]
pub enum RealLink {
   Default,
}

