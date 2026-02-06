import {AppInfo, AppInfoResponse, InstalledAppId, CellInfo, CellType} from "@holochain/client";
import {AgentId, CellAddress, ConductorAppProxy, DnaId} from "@ddd-qc/cell-proxy";


/** */
async function generateFakeProfilesAppInfo(agentId: AgentId): Promise<AppInfo> {
    const fakeProfilesDnaCellInfo: CellInfo = {
        type: CellType.Provisioned,
        value: {
            name: "profiles",
            cell_id: new CellAddress(DnaId.empty(80), agentId).intoId(),
            dna_modifiers: {
                network_seed: "profiles-mock-ns",
                properties: new Uint8Array(),
                //origin_time: 1640995200000000,
                //quantum_time: {secs: 1, nanos: 0},
            }
        }
    }
    /** AppInfo */
    return {
        agent_pub_key: agentId.hash,
        installed_app_id: "profiles",
        cell_info: {
            profiles: [fakeProfilesDnaCellInfo],
        },
        status: {type: "enabled"},
        installed_at: 1640995200000000,
    };
}


/** */
export class ConductorProxyProfilesMock extends ConductorAppProxy {
    constructor(agentId: AgentId, appId: InstalledAppId) {
        super(null, 10 * 1000, appId, agentId);
    }


    /** */
    override async appInfo(): Promise<AppInfoResponse> {
        return generateFakeProfilesAppInfo(AgentId.empty(80));
    }

}
