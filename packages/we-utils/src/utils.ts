import {asCell, BaseRoleName, Cell, CellProxy, ConductorAppProxy} from "@ddd-qc/cell-proxy";
import {
  AppAgentClient,
  AppAgentWebsocket,
  CellInfo,
  DnaHash,
  encodeHashToBase64, EntryHash,
  InstalledAppId
} from "@holochain/client";
import {weaveUrlToLocation} from "@lightningrodlabs/we-applet";
import {HrlWithContext} from "@lightningrodlabs/we-applet/dist/types";
//import {Hrl} from "@lightningrodlabs/we-applet";


// /** */
// export function stringifyHrl(hrl: Hrl): string {
//   return `hrl://${encodeHashToBase64(hrl[0])}/${encodeHashToBase64(hrl[1])}`;
// }


/** */
export async function getCellInfo(client: AppAgentClient, maybeDnaHash: DnaHash | undefined, baseRoleName: BaseRoleName): Promise<CellInfo | null> {
  const appInfo = await client.appInfo();
  const cells = appInfo.cell_info[baseRoleName];
  for (const cellInfo of cells) {
    const cell = asCell(cellInfo);
    if (!cell) {
      continue;
    }
    /** return first found cell if no DnaHash given ; assuming provisioned */
    if (!maybeDnaHash) {
      console.log("getCellInfo() taking first cell:", cellInfo);
      return cellInfo;
    }
    /** otherwise check if cell has given dnaHash */
    const cellId = cell.cell_id;
    if (encodeHashToBase64(cellId[0]) == encodeHashToBase64(maybeDnaHash)) {
      return cellInfo;
    }
  }
  return null;
}


/** */
export async function asCellProxy(client: AppAgentClient, maybeDnaHash: DnaHash | undefined, appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<CellProxy> {
  const agentWs = client as AppAgentWebsocket;
  const appProxy = await ConductorAppProxy.new(agentWs.appWebsocket);
  const cellInfo = await getCellInfo(client, maybeDnaHash, baseRoleName);
  const cell = Cell.from(cellInfo, appId, baseRoleName)
  const cellProxy = new CellProxy(appProxy, cell);
  return cellProxy;
}



/** Wraps a path from @mdi/js into a svg, to be used inside an <sl-icon src=""></sl-icon> */
export function wrapPathInSvg(path) {
  return `data:image/svg+xml;utf8,${wrapPathInSvgWithoutPrefix(path)}`;
}

/** Wraps a path from @mdi/js into a svg, to be used inside an <sl-icon src=""></sl-icon> */
export function wrapPathInSvgWithoutPrefix(path) {
  return `<svg style='fill: currentColor' viewBox='0 0 24 24'><path d='${path}'></path></svg>`;
}


/** */
export async function emptyAppletHash(): Promise<EntryHash> {
  const zeroBytes = new Uint8Array(36).fill(0);
  return new Uint8Array([0x84, 0x21, 0x24, ...zeroBytes]);
}
