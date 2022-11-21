import {DnaProxy, DnaViewModel, HappViewModel, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import { EntryHash, InstalledAppId } from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {ReactiveElement} from "lit/development";


/** */
export interface DummyZomePerspective {
  values: number[],
}


/** 
 * 
 */
export class DummyZomeProxy extends ZomeProxy {
  get zomeName(): string {return "dummy"}
  async getDummy(eh: EntryHash): Promise<number> {
    return this.call('get_dummy', eh, null);
  }
  async createDummy(value: number): Promise<EntryHash> {
    return this.call('create_dummy', value, null);
  }
  async getMyDummies(): Promise<number[]> {
    return this.call('get_my_dummies', null, null);
  }  
}


/**
 * 
 */
export class DummyZvm extends ZomeViewModel<DummyZomePerspective, DummyZomeProxy> {
  /** Ctor */
  constructor(protected proxy: DnaProxy) {
    super(new DummyZomeProxy(proxy));
  }

  private _values: number[] = [];

  /** -- ViewModel Interface -- */

  static context = createContext<DummyZvm>('zvm/dummy');
  getContext():any {return DummyZvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): DummyZomePerspective {return {values: this._values}}

  async probeAll(): Promise<void> {
    //let entryDefs = await this._proxy.getEntryDefs();
    //console.log({entryDefs})
    this._values = await this._proxy.getMyDummies();
  }
}


/** 
 * 
 */
export class DummyDvm extends DnaViewModel<number> {
  /** Ctor */
  constructor(happ: HappViewModel) {
    const dnaProxy = happ.conductorAppProxy.newDnaProxy(happ.appInfo, "dummy_role");
    super(happ, dnaProxy, [DummyZvm]);
  }

  /** QoL Helpers */
  get dummyZvm(): DummyZvm {return this.getZomeViewModel("dummy") as DummyZvm}


  /** -- ViewModel Interface -- */

  static context = createContext<DummyDvm>('dvm/dummy');
  getContext():any {return DummyDvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}



}
