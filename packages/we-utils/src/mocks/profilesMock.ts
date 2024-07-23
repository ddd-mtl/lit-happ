import {AppInfo, AppInfoResponse, HoloHash, InstalledAppId} from "@holochain/client";
import {CellInfo} from "@holochain/client/lib/api/admin/types";
import {AgentId, CellAddress, ConductorAppProxy, DnaId} from "@ddd-qc/cell-proxy";


/** */
async function generateFakeProfilesAppInfo(agentId: AgentId): Promise<AppInfo> {
    const fakeProfilesDnaCellInfo: CellInfo = {
        provisioned: {
            name: "profiles",
            cell_id: new CellAddress(DnaId.empty(80), agentId).intoId(),
            dna_modifiers: {
                network_seed: "profiles-mock-ns",
                properties: new Uint8Array(),
                origin_time: 1640995200000000,
                quantum_time: {secs: 1, nanos: 0},
            }
        }
    }
    /** AppInfo */
    return {
        agent_pub_key: new HoloHash(agentId.hash),
        installed_app_id: "profiles",
        cell_info: {
            profiles: [fakeProfilesDnaCellInfo],
        },
        status: "running",
    };
}


/** */
export class ConductorProxyProfilesMock extends ConductorAppProxy {
    constructor(public readonly agentId: AgentId, public readonly appId: InstalledAppId) {
        super(10 * 1000, appId, agentId);
    }


    /** */
    async appInfo(): Promise<AppInfoResponse> {
        return generateFakeProfilesAppInfo(AgentId.empty(80));
    }

}
