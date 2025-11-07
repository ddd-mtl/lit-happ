import {html} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {AgentId, DnaElement} from "@ddd-qc/lit-happ";
import { TaskerDvm } from "../viewModel/tasker.dvm";
import {TaskerPerspective, TaskListMaterialized} from "../viewModel/tasker.perspective";
import {encodeHashToBase64, EntryHashB64} from "@holochain/client";


/**
 * @element tasker-page
 */
@customElement("tasker-page")
export class TaskerPage extends DnaElement<unknown, TaskerDvm> {

  constructor() {
    super(TaskerDvm.DEFAULT_BASE_ROLE_NAME)
  }

  /** -- Fields -- */
  @state() private _initialized = false;
  @state() private _selectedListEh: EntryHashB64 | undefined = undefined;

  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;


  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  taskerPerspective!: TaskerPerspective;

  /** -- Methods -- */

  protected override async dvmUpdated(newDvm: TaskerDvm, oldDvm?: TaskerDvm): Promise<void> {
    console.log("<tasker-page>.dvmUpdated()");
    if (oldDvm) {
      console.log("\t Unsubscribed to taskerZvm's roleName = ", oldDvm.taskerZvm.cell.name)
      oldDvm.taskerZvm.unsubscribe(this);
    }
    newDvm.taskerZvm.subscribe(this, 'taskerPerspective');
    console.log("\t Subscribed taskerZvm's roleName = ", newDvm.taskerZvm.cell.name)
    newDvm.probeAll();
    this._selectedListEh = undefined;
    //this.taskerPerspective = emptyTaskerPerspective;
    this._initialized = true;
  }



  // /** After first render only */
  // async firstUpdated() {
  //   this._initialized = true;
  // }


  /** */
  async refresh(_e?: any) {
    //console.log("tasker-page.refresh() called")
    await this._dvm.probeAll();
  }


  /** */
  async onCreateList(_e: any) {
    const input = this.shadowRoot!.getElementById("listTitleInput") as HTMLInputElement;
    /*let res =*/ await this._dvm.taskerZvm.createTaskList(input.value);
    //console.log("onCreateList() res:", res)
    input.value = "";
  }


  /** */
  async onCreateTask(_e: any) {
    //console.log("onCreateTask() CALLED", e)
    if (!this._selectedListEh) {
      return;
    }
    /* Assignee */
    const assigneeSelect = this.shadowRoot!.getElementById("selectedAgent") as HTMLSelectElement;
    const assignee = assigneeSelect.value;
    //console.log("Assignee value:", assignee);
    /* Title */
    const input = this.shadowRoot!.getElementById("itemTitleInput") as HTMLInputElement;
    //console.log(input)
    /*let res =*/ this._dvm.taskerZvm.createTaskItem(input.value, assignee, this._selectedListEh!);
    //console.log("onCreateList res:", res)
    input.value = "";
  }


  /** */
  async onLockList(_e: any) {
    // //console.log("onLockList() CALLED", this.selectedListEh)
    // if (!this._selectedListEh) {
    //   return;
    // }
    // try {
    //   let res = await this._dvm.taskerZvm.lockTaskList(this._selectedListEh!);
    //   //console.log("onLockList() res =", res)
    // } catch (e:any) {
    //   console.warn(e);
    //   alert("Must be editor to lock list 😋")
    // }
  }


  /** */
  async onListSelect(e: any) {
    console.log("onListSelect() CALLED", e)
    const selector = this.shadowRoot!.getElementById("listSelector") as HTMLSelectElement;
    if (!selector || !selector.value) {
      console.warn("No list selector value", selector);
      return;
    }
    console.log("onListSelect() value", selector.value)
    this._selectedListEh = selector.value;
    this.requestUpdate();
  }


  /** */
  async onSubmitCompletion(selectedList: TaskListMaterialized | null) {
    //console.log("onSubmitCompletion() CALLED", e)
    if (!selectedList) {
      return;
    }
    for (const [ehb64, _taskItem] of selectedList.items) {
      const checkbox = this.shadowRoot!.getElementById(ehb64) as HTMLInputElement;
      //console.log("" + checkbox.checked + ". checkbox " + ehb64)
      if (checkbox.checked) {
        await this._dvm.taskerZvm.completeTask(ehb64)
      }
    }

    this._dvm.taskerZvm.probeAll();
    //this.requestUpdate();
  }


  /** */
  override render() {
    console.log("<tasker-page.render()> render()", this._initialized, this._selectedListEh);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }
    console.log("\t Using taskerZvm's roleName = ", this._dvm.taskerZvm.cell.name)

    let taskListEntries = this._dvm.taskerZvm.perspective.taskListEntries;
    console.log("<tasker-page.render()> render() taskListEntries", taskListEntries);
    let agents: AgentId[] = this._dvm.AgentDirectoryZvm.perspective.agents;
    let myRoles = this._dvm.taskerZvm.perspective.myRoles;
    let maybeSelectedList: TaskListMaterialized | undefined = undefined;
    if (this._selectedListEh !== undefined) {
      maybeSelectedList = this._dvm.taskerZvm.perspective.taskLists[this._selectedListEh];
      if (!maybeSelectedList === undefined) {
         console.warn("No list found for selectedListEh", this._selectedListEh);
      //   //this.refresh();
      //   return html`<span>Loading...</span>`;
      }
    }

    //console.log("tasker-page.render() selectedList", selectedList);

    const listEntryLi = Object.entries(taskListEntries).map(
        ([_ehB64, taskList]) => {
          //console.log("localTaskList.item:", ahB64)
          return html `<li>${taskList.title}</li>`
        }
    )

    const listEntryOption = Object.entries(taskListEntries).map(
      ([ehB64, taskList]) => {
        //console.log("taskList:", ahB64)
        return html `<option value="${ehB64}">${taskList.title}</option>`
      }
    )

    const AgentOptions = Object.values(agents).map(
        (agentId) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value=${agentId}>${agentId.short}</option>`
        }
    )


    /** Display selected list */
    let selectedListHtml = html `<h3>none</h3>`
    if (maybeSelectedList !== undefined) {
      const listItems = Object.entries(maybeSelectedList!.items).map(
          ([_index, [ahB64, taskItem]]) => {
            ///console.log("taskItem:", taskItem)
            return html`
              <input type="checkbox" id="${ahB64}" value="${ahB64}" .checked=${taskItem.isCompleted} .disabled=${maybeSelectedList!.isLocked || taskItem.isCompleted}>              
              <label for="${ahB64}"><b>${taskItem.entry.title}</b></label><span> - <i>${encodeHashToBase64(taskItem.entry.assignee)}</i></span><br>
              `
          }
      )
      selectedListHtml = html `
        <h2>${maybeSelectedList.title}</h2>
            <!-- <span>Locked: ${maybeSelectedList.isLocked}</span> -->
          <input type="button" value="Lock" @click=${this.onLockList} .disabled=${maybeSelectedList.isLocked}>
          <br/>
          <label for="itemTitleInput">Add task:</label>
          <input type="text" id="itemTitleInput" name="title" .disabled=${maybeSelectedList.isLocked}>
          <select name="selectedAgent" id="selectedAgent" .disabled=${maybeSelectedList.isLocked}>
            ${AgentOptions}
          </select>
        <input type="button" value="Add" @click=${this.onCreateTask} .disabled=${maybeSelectedList.isLocked}>
          <form id="listForm">
              ${listItems}
          <input type="button" value="submit" @click=${() => this.onSubmitCompletion(maybeSelectedList!)} .disabled=${maybeSelectedList.isLocked}>
          </form>
      `
    }

    /** render all */
    let myRolesStr = "none"
    if (myRoles.length > 0) {
      myRolesStr = ""
      for (const name of myRoles) {
        myRolesStr += ", " + name
      }
    }
    return html`
      <div>
        <h1>Tasker</h1>
        <span id="responseSpan"><b>My Roles:</b> ${myRolesStr}</span>
        <ul>${listEntryLi}</ul>
          <label for="listTitleInput">New list:</label>
          <input type="text" id="listTitleInput" name="title">
          <input type="button" value="create" @click=${this.onCreateList}>
        <h2>
          Selected List:
          <select name="listSelector" id="listSelector" @click=${this.onListSelect}>
            ${listEntryOption}
          </select>
        </h2>
        ${selectedListHtml}
      </div>
    `;
  }

}
