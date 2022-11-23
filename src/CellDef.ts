import {AgentPubKeyB64, DnaHashB64} from "@holochain-open-dev/core-types";
import {CellId, InstalledCell, RoleId} from "@holochain/client";

/**
 *
 */
export interface ICellDef {
  get cellDef(): InstalledCell;
  get roleId(): RoleId;
  get dnaHash(): DnaHashB64;
  get agentPubKey(): AgentPubKeyB64;
  get cellId(): CellId;
}
