import {ZomeViewModel, AgentId} from "@ddd-qc/lit-happ";
import {AgentDirectoryProxy} from "./bindings/agent_directory.proxy";

/** Perspective */
export interface AgentDirectoryPerspective {
  agents: AgentId[],
}

/** */
export class AgentDirectoryZvm extends ZomeViewModel {

  /** -- ZVM Boilerplate -- */
  static readonly ZOME_PROXY = AgentDirectoryProxy;

  get zomeProxy(): AgentDirectoryProxy {
    return this._zomeProxy as AgentDirectoryProxy;
  }

  /** -- Fields -- */

  private _agents: AgentId[] = [];

  /** -- Methods -- */

  /* */
  get perspective(): AgentDirectoryPerspective {
    return {agents: this._agents}
  }

  /** */
  protected hasChanged(): boolean {
    if (!this._previousPerspective) return true;
    return JSON.stringify(this.perspective.agents) !== JSON.stringify((this._previousPerspective as AgentDirectoryPerspective).agents)
  }

  /** */
  async probeAllInner(): Promise<void> {
    await this.probeRegisteredAgents()
  }

  /** */
  async probeRegisteredAgents() {
    console.log("AgentDirectoryZvm.probeRegisteredAgents()");
    let agents = await this.zomeProxy.getRegisteredAgents();
    this._agents = agents.map((agentKey) => new AgentId(agentKey));
    this.notifySubscribers()
  }
}
