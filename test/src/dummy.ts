import {DnaClient, ZomeBridge, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";


/** */
export class DummyBridge extends ZomeBridge {
  zomeName = 'dummy'
  async getDummy(): Promise<void> {
    return this.call('get_dummy', null);
  }
}


/** */
export class DummyViewModel extends ZomeViewModel<number, DummyBridge> {
  constructor(protected dnaClient: DnaClient) {
    super(new DummyBridge(dnaClient));
  }

  static context = createContext<DummyViewModel>('zome_view_model/dummy');

  getContext():any {return DummyViewModel.context}

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
