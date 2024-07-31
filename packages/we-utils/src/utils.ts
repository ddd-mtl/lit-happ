import {
  asCell,
  BaseRoleName,
  Cell,
  CellProxy,
  ConductorAppProxy,
  DhtId,
  DnaId,
  enc64,
  EntryId
} from "@ddd-qc/cell-proxy";
import {
  AppClient,
  AppWebsocket,
  CellInfo, HoloHash,
  InstalledAppId
} from "@holochain/client";
import {Hrl} from "@lightningrodlabs/we-applet";


export function intoHrl(dna: DnaId, dht: DhtId): Hrl {
  return [new HoloHash(dna.hash), new HoloHash(dht.hash)];
}


/** */
export async function getCellInfo(client: AppClient, maybeDnaId: DnaId | undefined, baseRoleName: BaseRoleName): Promise<CellInfo | null> {
  const appInfo = await client.appInfo();
  const cells = appInfo.cell_info[baseRoleName];
  for (const cellInfo of cells) {
    const cell = asCell(cellInfo);
    if (!cell) {
      continue;
    }
    /** return first found cell if no DnaHash given ; assuming provisioned */
    if (!maybeDnaId) {
      console.log("getCellInfo() taking first cell:", cellInfo);
      return cellInfo;
    }
    /** otherwise check if cell has given dnaHash */
    const cellId = cell.cell_id;
    if (enc64(cellId[0]) == maybeDnaId.b64) {
      return cellInfo;
    }
  }
  return null;
}


/** */
export async function asCellProxy(client: AppClient, maybeDnaId: DnaId | undefined, appId: InstalledAppId, baseRoleName: BaseRoleName): Promise<CellProxy> {
  const appProxy = await ConductorAppProxy.new(client as AppWebsocket, appId);
  const cellInfo = await getCellInfo(client, maybeDnaId, baseRoleName);
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
