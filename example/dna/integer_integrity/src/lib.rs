use hdi::prelude::*;

///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Integer {
   pub value: u32,
}


#[hdk_entry_defs]
#[unit_enum(DummyEntryTypes)]
pub enum IntegerEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   Integer(Integer),
}


#[hdk_link_types]
pub enum IntegerLinkType {
   Default,
   ToValues,
}

