import {DnaClient, ZomeBridge, ZomeViewModel} from "@ddd-qc/dna-client";

/** */
export class DummyBridge extends ZomeBridge {
  zomeName = 'dummy'
  getDummy(): void {}
}


/** */
export class DummyViewModel extends ZomeViewModel<number, DummyBridge> {
  constructor(protected dnaClient: DnaClient) {
      super(new DummyBridge(dnaClient));
  }

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
