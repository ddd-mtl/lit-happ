/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "profilesAlt" */
export const profilesAltFunctionNames: FunctionName[] = [
	"entry_defs", 
	"get_zome_info", 
	"get_dna_info",


	"create_profile",
	"update_profile",
	"search_agents",
	"find_profile",
	"probe_profiles",
	"cast_tip",
];


/** Generate tuple array of function names with given zomeName */
export function generateProfilesAltZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   const fns: [ZomeName, FunctionName][] = [];
   for (const fn of profilesAltFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "profiles" */
export const profilesAltZomeFunctions: [ZomeName, FunctionName][] = generateProfilesAltZomeFunctionsArray("profiles");
