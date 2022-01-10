import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Color,
  Engine,
  Gearbox,
  Model,
  Part,
  PartsQuery,
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
  model?: Model;
  engine?: Engine;
  gearbox?: Gearbox;
  color?: Color;
  // #endregion
}
const initialState: State = {
  parts: { allCarModels: [], allColors: [], allEngines: [], allGearboxes: [] },
  mappedModels: [],
  mappedEngines: [],
  mappedGearboxes: [],
  isLoading: true,
};

// #region Types
type PickProp<P extends keyof State> = Required<State>[P];
export type ParamsId = [
  string | null,
  string | null,
  string | null,
  string | null
];
type InitPayload = PayloadAction<{
  dato: PickProp<"parts">;
  paramsIds: ParamsId;
}>;
type PartsLayersTuple = [Model[], Engine[], Gearbox[]];
//#endregion

// #region Local Util Functions

function updatePrice(
  state: Pick<State, "model" | "engine" | "gearbox">
): number | undefined {
  const { model, engine, gearbox } = state;
  const parts = [model, engine, gearbox];

  const newPrice = parts.reduce((sum, part) => {
    return sum + (part?.price || 0);
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
  partsArr: PartsLayersTuple,
  active: [Model | undefined, Engine | undefined, Gearbox | undefined]
): PartsLayersTuple => {
  //#region Utils
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
  function mapDown<T extends Part[][]>(checkItem: Part, localParts: T) {
    // const checkItem = localParts[0][checkItem];
    let valids = validOfItem(checkItem);
    valids = assertValids(valids, checkItem?.__typename, "checkDown");

    for (let i = 1; i < localParts.length; i++) {
      const currentParts = localParts[i];
      localParts[i] = mapParts(currentParts, valids);
      valids = getFlatValids(currentParts);
    }
    return localParts;
  }
  const mapUp: typeof mapDown = (checkItem, localParts) => {
    const { length } = localParts;

    let checkItems = [checkItem];

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
  //#endregion

  const activePart = active[depth];
  if (activePart !== undefined)
    partsArr.forEach((parts, _dep) => {
      if (_dep === depth) return parts;

      if (_dep - depth > 0) {
        const slice = mapDown(activePart, partsArr.slice(depth, _dep + 1));
        partsArr = partsArr
          .slice(0, depth)
          .concat(slice)
          .concat(partsArr.slice(_dep + 1)) as PartsLayersTuple;
      } else {
        const slice = mapUp(activePart, partsArr.slice(_dep, depth + 1));
        partsArr = partsArr
          .slice(0, _dep)
          .concat(slice)
          .concat(partsArr.slice(depth + 1)) as PartsLayersTuple;
      }
    });
  if (depth === 0) return partsArr;
  return tree(depth - 1, partsArr, active);
};
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    setParts(state, { payload }: InitPayload) {
      const { dato, paramsIds } = payload;
      const { allCarModels, allEngines, allGearboxes, allColors } = dato;
      const parts = [allCarModels, allEngines, allGearboxes, allColors];
      const [model, engine, gearbox, color] = paramsIds.map((id, i) =>
        id
          ? findById<Model | Engine | Gearbox | Color>(parts[i], id)
          : undefined
      ) as [
        Model | undefined,
        Engine | undefined,
        Gearbox | undefined,
        Color | undefined
      ];

      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [model, engine, gearbox]
      );
				const price = updatePrice({model, engine, gearbox})
      return {
        ...state,
        parts: dato,
        isLoading: false,
        mappedModels,
        allCarModels,
        mappedEngines,
        allEngines,
        mappedGearboxes,
        allGearboxes,
				price,
        model,
        engine,
        gearbox,
        color,
      };
    },
    setModel(state, { payload }: PayloadAction<Model | undefined>) {
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
    setEngine(state, { payload }: PayloadAction<Engine | undefined>) {
      const { parts, model, gearbox } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      state.engine = payload;
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [model, payload, gearbox]
      );

      state.mappedGearboxes = mappedGearboxes; //modelsByEngine()
      state.mappedModels = mappedModels;
      state.mappedEngines = mappedEngines;
      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: PayloadAction<Gearbox | undefined>) {
      const { engine, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      const [mappedModels, mappedEngines, mappedGearboxes] = tree(
        2,
        [allCarModels, allEngines, allGearboxes],
        [model, engine, payload]
      );
      state.gearbox = payload;

      state.mappedEngines = mappedEngines;
      state.mappedModels = mappedModels;
      state.mappedGearboxes = mappedGearboxes;

      state.price = updatePrice(state);
      return state;
    },
    setColor(state, { payload }: PayloadAction<Color | undefined>) {
      return { ...state, color: payload };
    },
  },
});
export const carReducer = carSlice.reducer;
export const { setEngine, setGearbox, setModel, setParts, setColor } =
  carSlice.actions;
