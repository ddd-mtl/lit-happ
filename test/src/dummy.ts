import {DnaClient, DnaViewModel, ZomeBridge, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {ReactiveElement} from "lit/development";


/** */
export class DummyBridge extends ZomeBridge {
  zomeName = 'dummy'
  async getDummy(): Promise<void> {
    return this.call('get_dummy', null);
  }
}


/**
 *
 */
export class DummyZvm extends ZomeViewModel<number, DummyBridge> {
  constructor(protected dnaClient: DnaClient) {
    super(new DummyBridge(dnaClient));
  }

  static context = createContext<DummyZvm>('zome_view_model/dummy');

  getContext():any {return DummyZvm.context}

  protected hasChanged(): boolean {
    return false;
  }

  get perspective(): number {
    return 42;
  }

  async probeDht(): Promise<void> {
    let entryDefs = await this._bridge.getEntryDefs();
    console.log({entryDefs})
    this._bridge.getDummy();
  }
}


/**
 *
 */
export class DummyDvm extends DnaViewModel {
  /** async factory */
  static async new(host: ReactiveElement, port: number, installedAppId: string): Promise<DummyDvm> {
    let dnaClient = await DnaClient.new(port, installedAppId);
    return new DummyDvm(host, dnaClient);
  }

  private constructor(host: ReactiveElement, dnaClient: DnaClient) {
    super(host, dnaClient);
    this.addZomeViewModel(DummyZvm);
  }

  get dummyZvm(): DummyZvm { return this.getZomeViewModel("dummy") as DummyZvm}

}
