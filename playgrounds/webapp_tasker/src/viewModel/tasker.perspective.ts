import {TaskItem, TaskList} from "../bindings/tasker.types";
import {EntryHashB64} from "@holochain/client";


/** */
export interface TaskItemMaterialized {
    entry: TaskItem,
    isCompleted: boolean,
}
/** */
export interface TaskListMaterialized {
    title: string,
    isLocked: boolean,
    items: [EntryHashB64, TaskItemMaterialized][],
}


/** */
export interface TaskerPerspective {
    /** EntryHash -> TaskList */
    taskLists: Record<string, TaskListMaterialized>,
    taskListEntries: Record<string, TaskList>,
    /** EntryHash -> TaskItem */
    taskItems: Record<string, TaskItemMaterialized>,
    myRoles: string[],
}


