import {html} from "lit";
import {state, customElement} from "lit/decorators.js";
import {ZomeElement} from "@ddd-qc/lit-happ";
import {encodeHashToBase64} from "@holochain/client";
import {PathExplorerZvm} from "../viewModels/path-explorer.zvm";
import {AnyLinkableHashB64} from "../utils";
import {TypedAnchor} from "../bindings/path-explorer.types";

const LINK_KEYS = ['']; // FIXME Object.keys(ThreadsLinkTypeType);

/**
 *
 */
@customElement("paths-dashboard")
export class PathsDashboard extends ZomeElement<unknown, PathExplorerZvm> {

  constructor() {
    super(PathExplorerZvm.DEFAULT_ZOME_NAME);
    console.log("<paths-dashboard>.ctor()");
  }

  /** -- Fields -- */
  @state() private _initialized = false;
  @state() private _selectedHash: AnyLinkableHashB64 = '';


  private _agentKeyEntryHash?: AnyLinkableHashB64;

  /** -- Methods -- */

  /** */
  protected override async zvmUpdated(newZvm: PathExplorerZvm, _oldZvm?: PathExplorerZvm): Promise<void> {
    console.log("<paths-dashboard>.zvmUpdated()");
    this._selectedHash = '';
    this._agentKeyEntryHash = encodeHashToBase64(await newZvm.zomeProxy.getAgentEntryHash());
    this._initialized = true;
  }


  /** */
  async printRootAnchors() {
    const rootAnchors = await this._zvm.zomeProxy.getAllRootAnchors();
    console.log({rootAnchors})
    for (const rootAnchor of rootAnchors) {
      //const str = utf32Decode(new Uint8Array(child[1]));
      console.log(`  - Root anchor: LinkType="${LINK_KEYS[rootAnchor.linkIndex]}" path="${rootAnchor.anchor}"`);
      //await this.printChildren(str);
    }
  }


  /** */
  async printChildren(root_ta: TypedAnchor) {
    const children = await this._zvm.zomeProxy.getTypedChildren(root_ta);
    //console.log({children})
    if (children.length == 0) {
      const itemLinks = await this._zvm.zomeProxy.getAllItemsFromAnchor(root_ta.anchor);
      if (itemLinks.length > 0) {
        const tag = new TextDecoder().decode(new Uint8Array(itemLinks[0]!.tag));
        const leaf = root_ta.anchor + tag
        console.log(`  - Anchor: LinkType="${LINK_KEYS[root_ta.linkIndex]}" path="${leaf}"`);
      }
      for (const itemLink of itemLinks) {
        const tag = new TextDecoder().decode(new Uint8Array(itemLink.tag));
        const hash = encodeHashToBase64(new Uint8Array(itemLink.itemHash));
        console.log(`    - LeafLink: LinkType="${LINK_KEYS[itemLink.linkIndex]}" tag="${tag}" hash="${hash}"`);
      }
    } else {
      for (const ta of children) {
        console.log(`  - Anchor: LinkType="${LINK_KEYS[ta.linkIndex]}" path="${ta.anchor}"`);
        await this.printChildren(ta);
      }
    }
  }


  /** */
  override render() {
    console.log("<paths-dashboard> render()", this._initialized, this._selectedHash);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }
    //console.log("\t Using threadsZvm.roleName = ", this._dvm.threadsZvm.cell.name)

    /** Render all */
    return html`
        <div>
            <button @click="${async () => {
                console.log("*** Scan Root Anchors:");
                await this.printRootAnchors();
            }
            }">Scan Root Anchors
            </button>
            <button @click="${async () => {
                console.log("*** Scan latest items");
                //let res = await this._zvm.zomeProxy.getLatestItems();
                //console.log({res})
            }
            }">Scan latest items
            </button>
            <h1>Paths Dashboard</h1>
            <!-- <h4>Agent entry hash: ${this._agentKeyEntryHash}</h4> -->
        </div>
        <!-- Anchor trees -->
        <div style="display: flex; flex-direction: row;margin-top:25px;">
            <anchor-tree style="width:50%; overflow:auto; background:lightcyan; padding-bottom:5px"
                         @hashSelected="${(e:any) => {this._selectedHash = e.detail}}"></anchor-tree>
            <link-list .rootHash="${this._selectedHash}"
                       style="width:50%; overflow:auto; background:azure; padding-bottom:5px;"></link-list>
        </div>
    `;
  }

}
