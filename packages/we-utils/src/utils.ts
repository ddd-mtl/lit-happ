import {
  asCell,
  BaseRoleName,
  Cell,
  CellProxy,
  ConductorAppProxy,
  DhtId,
  DnaId,
  enc64,
} from "@ddd-qc/cell-proxy";
import {
  AppClient,
  AppWebsocket,
  CellInfo,
  InstalledAppId
} from "@holochain/client";
import {Hrl} from "@theweave/api";


export function intoHrl(dna: DnaId, dht: DhtId): Hrl {
  //return [new HoloHash(dna.hash), new HoloHash(dht.hash)];
  return [dna.hash, dht.hash];
}


/** */
export async function getCellInfo(client: AppClient, maybeDnaId: DnaId | undefined, baseRoleName: BaseRoleName): Promise<CellInfo | null> {
  const appInfo = await client.appInfo();
  if (!appInfo) {
    return null;
  }
  const cells = appInfo.cell_info[baseRoleName];
  if (!cells) {
    return null;
  }
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
  if (!cellInfo) {
    throw Promise.reject("CellInfo not found");
  }
  const cell = Cell.from(cellInfo, appId, baseRoleName)
  const cellProxy = new CellProxy(appProxy, cell);
  return cellProxy;
}



/** Wraps a path from @mdi/js into a svg, to be used inside an <sl-icon src=""></sl-icon> */
export function wrapPathInSvg(path: string) {
  return `data:image/svg+xml;utf8,${wrapPathInSvgWithoutPrefix(path)}`;
}

/** Wraps a path from @mdi/js into a svg, to be used inside an <sl-icon src=""></sl-icon> */
export function wrapPathInSvgWithoutPrefix(path: string) {
  return `<svg style='fill: currentColor' viewBox='0 0 24 24'><path d='${path}'></path></svg>`;
}
