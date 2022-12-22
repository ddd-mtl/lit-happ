import {CapSecret, FunctionName, ZomeName} from "@holochain/client";
import {CellMixin, ZomeSpecific} from "./mixins";
import {CellProxy} from "./CellProxy";

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


  // private _signingProps?: {
  //   capSecret: CapSecret;
  //   keyPair: nacl.SignKeyPair;
  //   signingKey: AgentPubKey;
  // };
  // setSigningProps(signingProps: { capSecret: CapSecret; keyPair: nacl.SignKeyPair; signingKey: AgentPubKey}): void {
  //   this._signingProps = signingProps;
  // }

  /** Helper for calling a zome function on its zome */
  protected async call(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    if (!(this.constructor as any).FN_NAMES.includes(fnName)) {
      Promise.reject(`Function "${fnName}()" not part of zome "${this.zomeName}"`);
    }
    const cap_secret = maybeSecret
      ? maybeSecret
      // : this._signingProps
      //   ? this._signingProps.capSecret
        : null;
    return this._cellProxy.callZome(this.zomeName, fnName, payload, cap_secret, timeout);
  }

  /** Helper for calling a zome function on its zome */
  protected async callBlocking(fnName: FunctionName, payload: any, maybeSecret?: CapSecret, timeout?: number): Promise<any> {
    //console.log("ZomeProxy.call", this.zomeName)
    if (!(this.constructor as any).FN_NAMES.includes(fnName)) {
      Promise.reject(`Function "${fnName}()" not part of zome "${this.zomeName}"`);
    }
    const cap_secret = maybeSecret? maybeSecret : null;
    return this._cellProxy.callZomeBlocking(this.zomeName, fnName, payload, cap_secret, timeout);
  }

}
