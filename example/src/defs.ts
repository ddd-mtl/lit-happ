import {HvmDef, ZvmDef} from "@ddd-qc/dna-client";
import {DummyDvm, DummyZvm} from "./viewModels/dummy";
import {RealDvm, RealZvm} from "./viewModels/real";
import {LabelZvm} from "./viewModels/label";


export const PLAYGROUND_DEF: HvmDef = {
  id: "playground",
  dvmDefs: [DummyDvm, RealDvm, [RealDvm, "rImpostor"]],
};


// export const PLAYGROUND_DEF = {
//   id: "playground",
//   dvmDefs: [
//     [DummyDvm, [DummyZvm, [LabelZvm, "zDummyLabel"]]],
//     [RealDvm],
//     [RealDvm, "rImpostor", [DummyZvm, [LabelZvm, "zRealLabel"]]],
//   ],
// };
