#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]


use hdi::prelude::*;


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Label {
   pub name: String,
}


#[hdk_entry_types]
#[unit_enum(LabelEntryTypes)]
pub enum LabelEntry {
   #[entry_type(required_validations = 3, visibility = "public")]
   Label(Label),
}



#[hdk_link_types]
pub enum LabelLink {
   Default,
}

