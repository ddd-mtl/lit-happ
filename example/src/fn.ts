import {ZomeName, FunctionName} from '@holochain/client';


// export const integerZomeFunctions: [ZomeName, FunctionName][] = [
//   ["zInteger", "entry_defs"],
//   ["zInteger", "get_integer"],
//   ["zInteger", "create_integer"],
//   ["zInteger", "get_my_values"],
// ];
//
//
// export const realZomeFunctions: [ZomeName, FunctionName][] = [
//   ["zReal", "entry_defs"],
//   ["zReal", "get_real"],
//   ["zReal", "create_real"],
//   ["zReal", "get_my_reals"],
// ];
//
// export const labelZomeFunctions: [ZomeName, FunctionName][] = [
//   ["zLabel", "entry_defs"],
//   ["zLabel", "get_label"],
//   ["zLabel", "create_labels"],
//   ["zLabel", "get_my_labels"],
// ];




export const integerZomeFunctions: FunctionName[] = [
  "entry_defs",
  "get_integer",
  "create_integer",
  "get_my_values",
];


export const realZomeFunctions: FunctionName[] = [
  "entry_defs",
  "get_real",
  "create_real",
  "get_my_reals",
];

export const labelZomeFunctions: FunctionName[] = [
  "entry_defs",
  "get_label",
 "create_labels",
  "get_my_labels",
];
