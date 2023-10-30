import {AppAgentClient, EntryHash} from "@holochain/client";
import {ProfilesClient} from "@holochain-open-dev/profiles";
import {WeServices} from "@lightningrodlabs/we-applet";
import {HappElement} from "@ddd-qc/lit-happ";


export type CreateAppletFn = (
    client: AppAgentClient,
    thisAppletHash: EntryHash,
    profilesClient: ProfilesClient,
    weServices: WeServices
) => Promise<HappElement>;


export type CreateWeServicesMockFn = (devtestAppletId: string) => Promise<WeServices>;

export interface DevTestNames {
    installed_app_id: string,
    provisionedRoleName: string,
}
