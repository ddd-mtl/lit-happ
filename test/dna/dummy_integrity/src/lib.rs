#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]


use hdi::prelude::*;


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Dummy {}



///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Fake {
   name: String,
}


#[hdk_entry_defs]
#[unit_enum(DummyEntryTypes)]
pub enum DummyEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   Dummy(Dummy),
   #[entry_def(required_validations = 3, visibility = "public")]
   Fake(Fake),
}



#[hdk_link_types]
pub enum DummyLinkType {
   All,
   ToDummies,
}

