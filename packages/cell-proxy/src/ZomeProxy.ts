import {CapSecret, FunctionName, ZomeName} from "@holochain/client";
import {CellMixin, ZomeSpecific} from "./mixins";
import {CellProxy} from "./CellProxy";
import {DnaInfo, EntryDef, ZomeInfo} from "./types";
import {Dictionary} from "./utils";

export type ZomeProxyConstructor = {new(cellProxy: CellProxy, zomeName?: ZomeName): ZomeProxy} & typeof ZomeSpecific;


/**
 * ABC for representing the zome function bindings of a Zome.
 * It holds the zomeName and reference to a CellProxy.
 */
export abstract class ZomeProxy extends CellMixin(ZomeSpecific) {

  /** Ctor */
  constructor(protected _cellProxy: CellProxy, zomeName?: ZomeName) {
    super();
    if (zomeName) {
      this.zomeName = zomeName;
    } else {
      if (!this.defaultZomeName) {
        throw Error("zomeName not defined in ZomeProxy subclass " + this.constructor.name);
      }
    }
    this._cell = _cellProxy.cell;
  }


  /** */
  private validateFunctionName(fnName: FunctionName): void {
    //const fnNames: FunctionName[] = this.fnNames.map(([a, b]) => b);
    //if (!fnNames.includes(fnName)) {
    if (!(this.constructor as any).FN_NAMES.includes(fnName)) {
      throw Error(`Function "${fnName}()" not part of zome "${this.zomeName}"`);
    }
  }

  /** Helper for calling a zome function on its zome */
  async call(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    this.validateFunctionName(fnName);
    const cap_secret = maybeSecret ? maybeSecret : null;
    return this._cellProxy.callZome(this.zomeName, fnName, payload, cap_secret, timeout);
  }


  /** Helper for calling a zome function on its zome */
  protected async callBlocking(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    this.validateFunctionName(fnName);
    const cap_secret = maybeSecret ? maybeSecret : null;
    return this._cellProxy.callZomeBlocking(this.zomeName, fnName, payload, cap_secret, timeout);
  }


  /** Helper for calling a zome function on its zome */
  protected async callZomeBlockPostCommit(entryType: string, fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    this.validateFunctionName(fnName);
    const cap_secret = maybeSecret ? maybeSecret : null;
    return this._cellProxy.callZomeBlockPostCommit(entryType, this.zomeName, fnName, payload, cap_secret, timeout);
  }


  /** */
  async zomeInfo(): Promise<ZomeInfo> {
    return this._cellProxy.callZomeInfo(this.zomeName);
  }

  /** */
  async dnaInfo(): Promise<DnaInfo> {
    return this._cellProxy.callDnaInfo(this.zomeName);
  }

  /** */
  async callEntryDefs(zomeName: ZomeName): Promise<Dictionary<EntryDef>> {
    return this._cellProxy.callEntryDefs(zomeName);
  }
}
