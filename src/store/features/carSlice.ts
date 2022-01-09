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
  mappedModels: Model[];
  mappedEngines: Engine[];
  mappedGearboxes: Gearbox[];
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
// type Nullab<T> = T | null;
type PartsNullTuple = [Model[], Engine[], Gearbox[]];
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

const isPartValid = (validArray: ObjectWithId[], part: Part): boolean => {
  if (part.disabled) return false;
  const foundItem = findById<ObjectWithId | Part>(validArray, part.id);
  return Boolean(foundItem);
};
function disablePart(part: Part): Part {
  return { ...part, disabled: true };
}
const mapParts = (parts: Part[], vArr: ObjectWithId[]): Part[] => {
  const mappedArr = parts.map((p) => {
    const { disabled } = p;
    const isValid = !disabled && isPartValid(vArr, p);
    if (!isValid) p = disablePart(p);
    return p;
  });
  return mappedArr;
};

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
  const getFlatValids = (parts: Part[]): ObjectWithId[] => {
    return parts.reduce((valids, part) => {
      let partValids: ObjectWithId[] | undefined;
      if (!part.disabled) partValids = validOfItem(part);

      return [...valids, ...(partValids || [])];
    }, [] as ObjectWithId[]);
  };
  function assertValids<T>(
    valids: T | undefined,
    typename: string | undefined,
    funcName: string
  ): T {
    if (valids === undefined)
      throw new Error(`Invalid start point in ${funcName}: ${typename}`);
    return valids;
  }
  function mapDown<T extends Part[][]>(itemIndex: number, localParts: T) {
    const checkItem = localParts[0][itemIndex];
    let valids = validOfItem(checkItem);
    valids = assertValids(valids, checkItem?.__typename, "checkDown");

    for (let i = 1; i < localParts.length; i++) {
      if (valids.length === 0) continue;
      const currentParts = localParts[i];
      localParts[i] = mapParts(currentParts, valids);
      valids = getFlatValids(currentParts);
    }
    return localParts;
  }

  const mapUp: typeof mapDown = (itemIndex, localParts) => {
    const { length } = localParts;

    let checkItems = [localParts[length - 1][itemIndex]];

    for (let i = length - 2; i >= 0; i--) {
      const arrAbove = localParts[i];
      const res = arrAbove.map((part) => {
        const valids = validOfItem(part);
        if (valids === undefined) return part;
        const isValid = checkItems.some((item) => {
          // if (item.disabled) return false;
          return isPartValid(valids, item);
        });
        if (!isValid) part = disablePart(part);
        return part;
        // return isValid ? part : null;
      });
      localParts[i] = res;
      checkItems = res;
    }
    return localParts;
  };

  const targetInd = indexes[depth];
  if (targetInd !== undefined)
    partsArr.forEach((parts, _dep) => {
      if (_dep === depth) return parts;

      if (_dep - depth > 0) {
        const slice = mapDown(targetInd, partsArr.slice(depth, _dep + 1));
        partsArr = partsArr
          .slice(0, depth)
          .concat(slice)
          .concat(partsArr.slice(_dep + 1)) as PartsNullTuple;
      } else {
        const slice = mapUp(targetInd, partsArr.slice(_dep, depth + 1));
        partsArr = partsArr
          .slice(0, _dep)
          .concat(slice)
          .concat(partsArr.slice(depth + 1)) as PartsNullTuple;
      }
    });
  if (depth === 0) return partsArr;
  return tree(depth - 1, partsArr, indexes);
};
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
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
      state.model = payload;
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [payload, engine, gearbox]
      );
      state.mappedEngines = mappedEngines;
      state.mappedGearboxes = mappedGearboxes;
      state.mappedModels = mappedModels;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: UndefNumPayl) {
      const { parts, model, gearbox } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
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
