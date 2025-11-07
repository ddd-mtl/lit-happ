import {
  ActionHashB64,
  AgentPubKeyB64,
  decodeHashFromBase64,
  encodeHashToBase64,
  EntryHash,
  EntryHashB64,
} from "@holochain/client";
import {TaskerProxy} from '../bindings/tasker.proxy';
import {TaskItem} from '../bindings/tasker.types';
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {TaskerPerspective, TaskItemMaterialized, TaskListMaterialized} from "./tasker.perspective";



/**
 *
 */
export class TaskerZvm extends ZomeViewModel {

  static override readonly ZOME_PROXY = TaskerProxy;
  get zomeProxy(): TaskerProxy {return this._zomeProxy as TaskerProxy;}


  // constructor(cellProxy: CellProxy, dvmParent: DnaViewModel, zomeName?: ZomeName) {
  //   super(cellProxy, dvmParent, zomeName);
  // }


  /** -- ViewModel -- */

  private _perspective: TaskerPerspective = {taskLists: {}, taskListEntries:{}, taskItems:{}, myRoles: []};

  /* */
  get perspective(): TaskerPerspective {return this._perspective}


  /** -- Methods -- */

  /** */
  async pullAllLists() {
    const lists = await this.zomeProxy.getAllLists();
    console.log("pullAllLists() lists:", lists);
    //console.log("pullAllLists() taskListEntryStore:", this.taskListEntryStore);
    for (const pair of lists) {
      const ehB64 = encodeHashToBase64(pair[0])
      this._perspective.taskListEntries[ehB64] = pair[1];
    }

    const listEntries = this._perspective.taskListEntries;
    //console.log({listEntries})
    let pr = Object.entries(listEntries).map(async ([listEhB64, listEntry]) => {
      const listEh: EntryHash = decodeHashFromBase64(listEhB64);
      const triples: [EntryHash, TaskItem, boolean][] = await this.zomeProxy.getListItems(listEh);
      //console.log({listEhB64, triples})
      const isLocked = await this.zomeProxy.isListLocked(listEh);
      const items: [EntryHashB64, TaskItemMaterialized][]= triples.map(([eh, entry, isCompleted]) => {
        return [encodeHashToBase64(eh), {entry, isCompleted}];
      });
      const list: TaskListMaterialized = {
        title: listEntry.title,
        isLocked,
        items,
      };
      return {eh: listEhB64, list};
    })
    Promise.all(pr).then((results) => {
      for (const obj of results) {
        this._perspective.taskLists[obj.eh] = obj.list;
      }
      this.notifySubscribers()
    })


    this.notifySubscribers();
  }


  /** */
  override async probeAll() {
    console.log("taskerViewModel.probeAll() called");
    /** Reset perspective */
    this._perspective.taskListEntries = {};
    this._perspective.taskLists = {};
    this._perspective.taskItems = {};
    this._perspective.myRoles = [];
    /** Get Lists */
    await this.pullAllLists();

    this.notifySubscribers()
  }


  /** Perform methods */

  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listEh: EntryHashB64): Promise<ActionHashB64> {
    let res = await this.zomeProxy.createTaskItem({
      title,
      assignee: decodeHashFromBase64(assignee),
      listEh: decodeHashFromBase64(listEh),
    });
    let resb64 = encodeHashToBase64(res);
    this.probeAll();
    return resb64;
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    let newList = encodeHashToBase64(await this.zomeProxy.createTaskList(title));
    this.pullAllLists();
    return newList;
  }

  // async lockTaskList(eh: EntryHashB64): Promise<ActionHashB64> {
  //   let res = encodeHashToBase64(await this.zomeProxy.membranedLockTaskList(decodeHashFromBase64(eh)));
  //   this.probeAll();
  //   return res;
  // }

  async completeTask(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = encodeHashToBase64(await this.zomeProxy.completeTask(decodeHashFromBase64(eh)));
    //this.pullAllFromDht();
    return res;
  }
}
