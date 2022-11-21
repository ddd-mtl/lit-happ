import {CellProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash } from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {LabelZvm} from "./label";

/** */
export interface RealZomePerspective {
  values: number[],
}


/**
 *
 */
export class RealZomeProxy extends ZomeProxy {
  get zomeName(): string {return "real"}
  async getReal(eh: EntryHash): Promise<number> {
    return this.call('get_real', eh, null);
  }
  async createReal(value: number): Promise<EntryHash> {
    return this.call('create_real', value, null);
  }
  async getMyReals(): Promise<number[]> {
    return this.call('get_my_reals', null, null);
  }
}


/**
 *
 */
export class RealZvm extends ZomeViewModel<RealZomePerspective, RealZomeProxy> {
  /** Ctor */
  constructor(protected proxy: CellProxy) {
    super(new RealZomeProxy(proxy));
  }

  private _values: number[] = [];

  /** -- ViewModel Interface -- */

  static context = createContext<RealZvm>('zvm/real');
  getContext():any {return RealZvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): RealZomePerspective {return {values: this._values}}

  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._proxy.getMyReals();
  }
}


/**
 *
 */
export class RealDvm extends DnaViewModel<number> {
  /** Ctor */
  constructor(happ: HappViewModel, roleId: string) {
    const cellProxy = happ.conductorAppProxy.newCellProxy(happ.appInfo, roleId); // FIXME can throw error
    super(happ, cellProxy, [RealZvm, LabelZvm]);
  }

  /** QoL Helpers */
  get realZvm(): RealZvm {return this.getZomeViewModel("real") as RealZvm}
  get labelZvm(): LabelZvm {return this.getZomeViewModel("label") as LabelZvm}


  /** -- ViewModel Interface -- */

  static context = createContext<RealDvm>('dvm/real');
  getContext():any {return RealDvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 3.1418}

}

