import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Engine,
  Gearbox,
  Model,
  Part,
  PartsQuery,
  PartsWithPrice,
} from "../../lib/datocms";
import { findById, ObjectWithId } from "../../utils/array";

interface State {
  parts: PartsQuery;
  isLoading: boolean;
  mappedModels: (Model | null)[];
  mappedEngines: (Engine | null)[];
  mappedGearboxes: (Gearbox | null)[];
  price?: number;
  // #region They Are Indexes
  model?: number;
  engine?: number;
  gearbox?: number;
  color?: number;
  // #endregion
}
const initialState: State = {
  parts: { allCarModels: [], allColors: [], allEngines: [], allGearboxes: [] },
  mappedModels: [],
  mappedEngines: [],
  mappedGearboxes: [],
  isLoading: true,
};

// #region Local Types
type PickProp<P extends keyof State> = Required<State>[P];
type StatePayload<P extends keyof State> = PayloadAction<PickProp<P>>;

type UndefNumPayl = PayloadAction<number | undefined>;
type Nullab<T> = T | null;
//#endregion

// #region Local Util Functions

function updatePrice(state: State): number | undefined {
  const { model, engine, gearbox, parts } = state;
  const partsIndexes = [model, engine, gearbox];
  const partsKeys: PartsWithPrice[] = [
    "allCarModels",
    "allEngines",
    "allGearboxes",
  ];
  if (partsIndexes.includes(undefined)) return undefined;
  const newPrice = partsKeys.reduce((sum, key, i) => {
    const part = parts[key][partsIndexes[i] as number];
    return sum + part.price;
  }, 0);
  return newPrice;
}

const isPartValid = <T extends ObjectWithId[]>(
  validArray: T,
  part: Part
): boolean => Boolean(findById(validArray, part.id));

const mapParts = (
  parts: Nullab<Part>[],
  vArr: ObjectWithId[]
): Nullab<Part>[] => {
  const mappedArr = parts.map((p) => {
    const isValid = p !== null && isPartValid(vArr, p);
    return isValid ? p : null;
  });
  return mappedArr;
};
// const gearByEngine = (
//   allGearboxes: Gearbox[],
//   mappedEngines: (Engine | null)[],
//   engine: number
// ) =>
//   allGearboxes.map((g) => {
//     let isSelEnginValid = true;
//     if (engine !== undefined) {
//       isSelEnginValid = isPartValid(
//         (mappedEngines[engine] as Engine).validGearboxes,
//         g
//       );
//     }
//     const isValid =
//       isSelEnginValid &&
//       mappedEngines.some((e) => {
//         if (e) {
//           const { validGearboxes } = e;
//           return isPartValid(validGearboxes, g);
//         }
//         return false;
//       });
//     return isValid ? g : null;
//   });
// const modelsByEngine = (allCarModels: Model[], engine: Engine) =>
//   allCarModels.map((m) => {
//     if (m) {
//       const { validEngines } = m;
//       const isValid = isPartValid(validEngines, engine);
//       if (isValid) return m;
//     }
//     return null;
//   });

// const validKeyDict =
//   // : { [key in Part["__typename"]]: ValidKeys[number] | undefined }
// {
//   CarModelRecord: "validEngines",
//   EngineRecord: "validGearboxes",
//   GearboxRecord: undefined,
// };
// type IsString<T, K extends keyof T> = K extends never
//   ? never
//   : T[K] extends string
//   ? K
//   : never;
// type ValidTypenames = IsString<typeof validKeyDict, keyof typeof validKeyDict>;
type PartsNullTuple = [Nullab<Model>[], Nullab<Engine>[], Nullab<Gearbox>[]];

const tree = (
  depth: number,
  partsArr: PartsNullTuple,
  indexes: [number | undefined, number | undefined, number | undefined]
): PartsNullTuple => {
  const validOfItem = (item: Part | null): ObjectWithId[] | undefined => {
    switch (item?.__typename) {
      case "CarModelRecord":
        return item.validEngines;
      case "EngineRecord":
        return item.validGearboxes;
      default:
        return undefined;
    }
  };
  const getFlatValids = (
    parts: Nullab<Part>[]
    // narrowTo?: ObjectWithId | ObjectWithId[] | null
  ): ObjectWithId[] => {
    return parts.reduce((valids, part) => {
      let partValids: ObjectWithId[] | undefined;
      if (part !== null) partValids = validOfItem(part);
      // if (narrowTo) {
      //   const isValid = partValids?.some(({ id }) => {
      //     if (narrowTo instanceof Array)
      //       return narrowTo.some(({ id: _id }) => _id === id);
      //     return id === narrowTo.id;
      //   })
      //   partValids = isValid ? partValids
      //     : undefined;
      // }
      return [...valids, ...(partValids || [])];
    }, [] as ObjectWithId[]);
  };
  function checkUndef<T>(
    valids: T | undefined,
    typename: string | undefined,
    funcName: string
  ): T {
    if (valids === undefined)
      throw new Error(`Invalid start point in ${funcName}: ${typename}`);
    return valids;
  }
  function checkDown<T extends Nullab<Part>[][]>(
    itemIndex: number,
    localParts: T
  ) {
    const checkItem = localParts[0][itemIndex];
    let valids = validOfItem(checkItem);
    valids = checkUndef(valids, checkItem?.__typename, "checkDown");

    for (let i = 1; i < localParts.length; i++) {
      if (valids.length === 0) continue;
      const currentParts = localParts[i];
      localParts[i] = mapParts(currentParts, valids);
      valids = getFlatValids(currentParts);
    }
    return localParts;
  }
  const checkUp: typeof checkDown = (itemIndex, localParts) => {
    const { length } = localParts;

    const checkItem = localParts[length - 1][itemIndex];
    let checkItems = [checkUndef(checkItem, checkItem?.__typename, "checkUp")];

    for (let i = length - 2; i >= 0; i--) {
      const arrAbove = localParts[i];

      const res = arrAbove.map((part) => {
        const valids = validOfItem(part);
        if (valids === undefined) return part;
        const isValid = checkItems.some((item) => {
          if (item === null) return item;
          return isPartValid(valids, item);
        });

        return isValid ? part : null;
      });
      localParts[i] = res;
      checkItems = res;
    }
    return localParts;
  };

  const targetInd = indexes[depth];
  // let arr = partsArr;
  if (targetInd !== undefined)
    partsArr.forEach((parts, _dep) => {
      if (_dep === depth) return parts;

      if (_dep - depth > 0) {
        const slice = checkDown(targetInd, partsArr.slice(depth, _dep + 1));
        partsArr = partsArr
          .slice(0, depth)
          .concat(slice)
          .concat(partsArr.slice(_dep + 1)) as PartsNullTuple;
      } else {
        const slice = checkUp(targetInd, partsArr.slice(_dep, depth + 1));
        partsArr = partsArr
          .slice(0, _dep)
          .concat(slice)
          .concat(partsArr.slice(depth + 1)) as PartsNullTuple;
      }
      // let mapFunc;

      // return parts;
      // switch (_dep - depth) {
      //   case -2:
      //     {
      //       const models = partsArr[0];
      //       const engines = partsArr[1];
      //       const gearboxes = partsArr[2];
      //       return models.map((m) => {
      //         if (m === null) return null;
      //         const { validEngines } = m;
      //         return validEngines.some(({ id }) =>
      //           findById(engines, id)?.validGearboxes.some(
      //             ({ id }) => findById(gearboxes, id)
      //           )
      //         );
      //       });
      //     }
      //   case -1: {
      // 		const mapArr = partsArr[_dep];
      //     break;
      //   }
      //   case 1: {
      //     break;
      //   }
      //   case 2: {
      //     break;
      //   }
      // }
      // switch(parts[depth]?.__typename){
      // 	case 'CarModelRecord':
      // 		mapFunc = (m:Model) =>{
      // 			// mapArr.every(({})=>a)

      // 		}
      // }
      // return parts.map((p) => );
    }); //as [Nullab<Model>[], Nullab<Engine>[], Nullab<Gearbox>[]];
  if (depth === 0) return partsArr;
  return tree(depth - 1, partsArr, indexes);
};
// const modelsByEnginess = (
//   allCarModels: Model[],
//   mappedEngines: (Engine | null)[],
//   engine: number | undefined
// ) =>
//   allCarModels.map((m) => {
//     const { validEngines } = m;
//     let isValidEngine = true;
//     // if (engine) {
//     if (engine !== undefined) {
//       isValidEngine = m.validEngines.some(
//         ({ id }) => id === (mappedEngines[engine] as Engine).id
//       );
//     }
//     const isValid =
//       isValidEngine &&
//       mappedEngines.some((e) => {
//         if (e) return isPartValid(validEngines, e);
//         return false;
//       });
//     return isValid ? m : null;
//   });
const enginesByModelGearbox = (
  allEngines: Engine[],
  allCarModels: Model[],
  model: number | undefined,
  gearbox: Gearbox
) =>
  allEngines.map((e) => {
    if (e) {
      const { validGearboxes } = e;
      let isModelValid = true;
      if (model !== undefined) {
        const modelPart = allCarModels[model];
        const { validEngines } = modelPart;
        isModelValid = isPartValid(validEngines, e);
      }
      const isValid = isPartValid(validGearboxes, gearbox) && isModelValid;
      if (isValid) return e;
    }
    return null;
  });
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
  // TODO refactor
  reducers: {
    setParts(state, { payload }: StatePayload<"parts">) {
      const { allCarModels, allEngines, allGearboxes } = payload;
      return {
        ...state,
        parts: payload,
        isLoading: false,
        mappedModels: allCarModels,
        mappedEngines: allEngines,
        mappedGearboxes: allGearboxes,
      };
    },
    setModel(state, { payload }: UndefNumPayl) {
      const { engine, gearbox, parts } = state;
      const { allEngines, allGearboxes, allCarModels } = parts;
      // let { mappedEngines, mappedGearboxes } = state;
      // let mappedEngines: (Engine | null)[] = allEngines;
      // let mappedGearboxes: (Gearbox | null)[] = allGearboxes;
      // console.log(payload);
      state.model = payload;
      // console.log(
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [payload, engine, gearbox]
      );
      // );

      // if (payload !== undefined) {
      //   let { validEngines } = parts.allCarModels[payload];

      //   // narrow validEngines
      //   if (gearbox !== undefined) {
      //     validEngines = validEngines.filter(({ id }) => {
      //       const e = findById(allEngines, id);
      //       if (e) return isPartValid(e.validGearboxes, allGearboxes[gearbox]);
      //       return false;
      //     });
      //   }

      //   mappedEngines = mapParts(allEngines, validEngines) as Nullab<Engine>[];
      //   if (engine !== undefined)
      //     mappedGearboxes = gearByEngine(allGearboxes, mappedEngines, engine);

      // clearIfInvalid(state, engine, mappedEngines, "engine");
      // clearIfInvalid(state, gearbox, mappedGearboxes, "gearbox");
      // }
      state.mappedEngines = mappedEngines;
      state.mappedGearboxes = mappedGearboxes;
      state.mappedModels = mappedModels;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: UndefNumPayl) {
      const { parts, model, engine, gearbox } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      // let mappedModels: (Model | null)[] = allCarModels;
      // let mappedGearboxes: (Gearbox | null)[] = allGearboxes;
      state.engine = payload;
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [model, payload, gearbox]
      );

      // console.log(payload);
      // if (payload !== undefined) {
      //   const { validGearboxes } = allEngines[payload];

      //   mappedGearboxes = mapParts(
      //     allGearboxes,
      //     validGearboxes
      //   ) as Nullab<Gearbox>[];
      //   mappedModels = modelsByEngine(allCarModels, allEngines[payload]);

      //   // clearIfInvalid(state, model, mappedModels, "model");
      //   // clearIfInvalid(state, gearbox, mappedGearboxes, "gearbox");
      // }
      state.mappedGearboxes = mappedGearboxes; //modelsByEngine()
      state.mappedModels = mappedModels;
      state.mappedEngines = mappedEngines;
      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: UndefNumPayl) {
      const { engine, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      // let mappedEngines: (Engine | null)[] = allEngines;
      // let mappedModels: (Model | null)[] = allCarModels;
      // console.log(
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [model, engine, payload]
      );
      // );
      state.gearbox = payload;
      // if (payload !== undefined) {
      //   mappedEngines = enginesByModelGearbox(
      //     allEngines,
      //     allCarModels,
      //     model,
      //     allGearboxes[payload]
      //   );
      // }
      // if (engine !== undefined) {
      //   mappedModels = modelsByEngine(allCarModels, allEngines[engine]);
      // }

      state.mappedEngines = mappedEngines;
      state.mappedModels = mappedModels;
      state.mappedGearboxes = mappedGearboxes;

      state.price = updatePrice(state);
      return state;
    },
    setColor(state, { payload }: UndefNumPayl) {
      return { ...state, color: payload };
    },
  },
});
export const carReducer = carSlice.reducer;
export const { setEngine, setGearbox, setModel, setParts, setColor } =
  carSlice.actions;
