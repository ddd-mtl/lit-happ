#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]


use hdi::prelude::*;


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Real {
   pub value: f32,
}


#[hdk_entry_defs]
#[unit_enum(RealEntryTypes)]
pub enum RealEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   Real(Real),
}



#[hdk_link_types]
pub enum RealLink {
   Default,
}

