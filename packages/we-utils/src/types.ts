import {RenderInfo, WeServices} from "@lightningrodlabs/we-applet";
import {HappElement} from "@ddd-qc/lit-happ";


export type CreateAppletFn = (renderInfo: RenderInfo, weServices: WeServices) => Promise<HappElement>;

export type CreateWeServicesMockFn = (devtestAppletId: string) => Promise<WeServices>;

export interface DevTestNames {
    installed_app_id: string,
    provisionedRoleName: string,
}
