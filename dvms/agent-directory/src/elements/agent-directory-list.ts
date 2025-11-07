import {html} from "lit";
import {state, customElement} from "lit/decorators.js";
import {ZomeElement} from "@ddd-qc/lit-happ";
import {AgentDirectoryPerspective, AgentDirectoryZvm} from "../agent_directory.zvm";

/**
 * @element agent-directory-list
 */
@customElement("agent-directory-list")
export class AgentDirectoryList extends ZomeElement<AgentDirectoryPerspective, AgentDirectoryZvm> {
  /** Ctor */
  constructor() {
    super(AgentDirectoryZvm.DEFAULT_ZOME_NAME);
  }

  /** -- Fields -- */

  @state() private _initialized = false;


  /** -- Methods -- */

  /** After first call to render() */
  async firstUpdated() {
    await this.refresh();
    this._initialized = true;
  }


  /** */
  async refresh(_e?: any) {
    this._zvm.probeAll();
  }


  /** */
  render() {
    console.debug("agent-directory-list render()");

    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }

    /* Agents */
    const agentLi = Object.entries(this.perspective.agents).map(
        ([_index, agentId]) => {
          return html `<li value="${agentId.b64}">${agentId.short}</li>`
        }
    )

    /** render all */
    return html`<ul>${agentLi}</ul>`;
  }
}
