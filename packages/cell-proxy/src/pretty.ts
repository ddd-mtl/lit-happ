
import {SignalLog} from "./AppProxy";
import {AppInfo, CellType} from "@holochain/client";
import {BaseRoleName, CellsForRole, str2CellId} from "./types";
import {intoStem} from "./cell";
import {enc64} from "./hash";


const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

export function prettyDuration(date: Date): string {
  return date.getSeconds() + "." + zeroPad(date.getMilliseconds(), 3)
}

/** */
export function prettyDate(date: Date): string {
  return ""
    + zeroPad(date.getHours(), 2)
    + ":" + zeroPad(date.getMinutes(), 2)
    + ":" + zeroPad(date.getSeconds(), 2)
    + "." + zeroPad(date.getMilliseconds(), 3);
}


export function prettySignalLogs(signalLogs: SignalLog[]) {
  return signalLogs.map((log) => {
    const dnaHash = enc64(str2CellId(log.cellId)[0]).slice(-8);
    return {timestamp: prettyDate(new Date(log.ts)), dnaHash, zome: log.zomeName, type: log.type, payload: log.zomeSignal};
  })
}


/** */
export function printAppInfo(appInfo: AppInfo): string {
  let print = `Happ "${appInfo.installed_app_id}" info: (status: ${JSON.stringify(appInfo.status)})`;
  for (const [roleName, cellInfos] of Object.entries(appInfo.cell_info)) {
    for (const cellInfo of  Object.values(cellInfos)) {
      if (CellType.Stem in cellInfo) {
        const stem = intoStem(cellInfo)!;
        print += `\n - ${roleName}.${stem.name? stem.name : "unnamed"}: ${enc64(stem.dna)} (stem)`;
        continue;
      }
      if (CellType.Provisioned in cellInfo) {
        const cell = cellInfo.provisioned;
        print += `\n - ${roleName}: ${cell.name} | ${enc64(cell.cell_id[0])}`;
        continue;
      }
      if (CellType.Cloned in cellInfo) {
        const cell = cellInfo.cloned;
        print += `\n - ${roleName}.${cell.clone_id}: ${cell.name} | ${enc64(cell.cell_id[0])}`;
        continue;
      }
    }
  }
  return print;
}


/** */
export function printCellsForRole(baseRoleName: BaseRoleName, cells: CellsForRole): string {
  let print = `CellsForRole "${baseRoleName}": (${enc64(cells.provisioned.cell_id[1])})\n`;
  print += `  - Provisioned: ${cells.provisioned.name} | ${enc64(cells.provisioned.cell_id[0])}\n`;
  print += `  - Clones : ${Object.values(cells.clones).length}\n`;
  for (const [cloneId, clone] of Object.entries(cells.clones)) {
    print += `    - (${clone.enabled? "enabled" : "disabled"})${cloneId}: ${clone.name} | ${enc64(clone.cell_id[0])}\n`;
  }
  return print;
}
