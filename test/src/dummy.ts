import {DnaProxy, DnaViewModel, HappController, ZomeProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {ReactiveElement} from "lit/development";


/** */
export class DummyZomeProxy extends ZomeProxy {
  get zomeName(): string {return "dummy"}
  async getDummy(): Promise<void> {
    return this.call('get_dummy', null, null);
  }
}


/** */
export class DummyZvm extends ZomeViewModel<number, DummyZomeProxy> {
  constructor(protected proxy: DnaProxy) {
    super(new DummyZomeProxy(proxy));
  }

  static context = createContext<DummyZvm>('zvm/dummy');
  getContext():any {return DummyZvm.context}

  protected hasChanged(): boolean {
    return false;
  }

  get perspective(): number {
    return 42;
  }

  async probeAll(): Promise<void> {
    let entryDefs = await this._proxy.getEntryDefs();
    console.log({entryDefs})
    this._proxy.getDummy();
  }
}


/** */
export class DummyDvm extends DnaViewModel<number> {
  /** async factory */
  static async new(happ: HappController): Promise<DummyDvm> {
    const dnaProxy = await happ.conductorAppProxy.newDnaProxy("playground", "dummy");
    return new DummyDvm(dnaProxy);
  }

  private constructor(dnaProxy: DnaProxy) {
    super(dnaProxy);
    this.addZomeViewModel(DummyZvm);
  }


  static context = createContext<DummyDvm>('dvm/dummy');
  getContext():any {return DummyDvm.context}

  protected hasChanged(): boolean {return true}

  get perspective(): number {return 4242}

  get dummyZvm(): DummyZvm {return this.getZomeViewModel("dummy") as DummyZvm}

}
