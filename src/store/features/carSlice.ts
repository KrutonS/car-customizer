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
  isLoading: true,
};

// #region Types

export type ParamsId = [
  string | null,
  string | null,
  string | null,
  string | null
];
type PickProp<P extends keyof State> = Required<State>[P];
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
const setDisable = (part: Part, disable = true): Part => ({
  ...part,
  disabled: disable,
});

const tree = (
  partsArr: PartsLayersTuple,
  active: [Model | undefined, Engine | undefined, Gearbox | undefined],
  depth = 2
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
  function mapDown<T extends Part[][]>(checkItem: Part, localParts: T) {
    let valids = validOfItem(checkItem) as ObjectWithId[];

    for (let i = 1; i < localParts.length; i++) {
      const partsBelow = localParts[i];
      // mapParts(currentParts, valids);
      partsBelow.forEach((part, j) => {
        const { disabled } = part;
        const isValid = !disabled && isPartValid(valids, part);
        if (!isValid) part = setDisable(part);
        partsBelow[j] = part;
      });
      valids = getFlatValids(partsBelow);
    }
  }
  const mapUp: typeof mapDown = (checkItem, localParts) => {
    const { length } = localParts;

    let checkItems = [checkItem];

    for (let i = length - 2; i >= 0; i--) {
      const partsAbove = localParts[i];
      partsAbove.forEach((part, j) => {
        const valids = validOfItem(part);
        if (valids === undefined) return part;
        const isValid = checkItems.some((item) => {
          return isPartValid(valids, item);
        });
        if (!isValid) part = setDisable(part);
        partsAbove[j] = part;
      });
      checkItems = partsAbove;
    }
  };
  //#endregion

  const clearDisables = depth === 2;

  if (clearDisables)
    partsArr = partsArr.map((parts) =>
      parts.map((part) => setDisable(part, false))
    ) as PartsLayersTuple;

  const activePart = active[depth];
  if (activePart !== undefined)
    partsArr.forEach((parts, _dep) => {
      if (_dep === depth) return parts;

      if (_dep - depth > 0) {
        mapDown(activePart, partsArr.slice(depth, _dep + 1));
      } else {
        mapUp(activePart, partsArr.slice(_dep, depth + 1));
      }
    });

  if (depth === 0) return partsArr;
  return tree(partsArr, active, depth - 1);
};
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    setParts(state, { payload }: InitPayload) {
      const { dato, paramsIds } = payload;
      let { allCarModels, allEngines, allGearboxes } = dato;
      const { allColors } = dato;
      const partsArr = [allCarModels, allEngines, allGearboxes, allColors];
      const [model, engine, gearbox, color] = paramsIds.map((id, i) =>
        id
          ? findById<Model | Engine | Gearbox | Color>(partsArr[i], id)
          : undefined
      ) as [
        Model | undefined,
        Engine | undefined,
        Gearbox | undefined,
        Color | undefined
      ];

      [allCarModels, allEngines, allGearboxes] = tree(
        [allCarModels, allEngines, allGearboxes],
        [model, engine, gearbox]
      );
      const parts = { allCarModels, allEngines, allGearboxes, allColors };
      const price = updatePrice({ model, engine, gearbox });
      return {
        ...state,
        parts,
        isLoading: false,
        price,
        model,
        engine,
        gearbox,
        color,
      };
    },
    setModel(state, { payload }: PayloadAction<Model | undefined>) {
      const { engine, gearbox, parts } = state;
      let { allEngines, allGearboxes, allCarModels } = parts;
      state.model = payload;

      [allCarModels, allEngines, allGearboxes] = tree(
        [allCarModels, allEngines, allGearboxes],
        [payload, engine, gearbox]
      );
      parts.allCarModels = allCarModels;
      parts.allEngines = allEngines;
      parts.allGearboxes = allGearboxes;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: PayloadAction<Engine | undefined>) {
      const { parts, model, gearbox } = state;
      let { allCarModels, allEngines, allGearboxes } = parts;
      state.engine = payload;

      [allCarModels, allEngines, allGearboxes] = tree(
        [allCarModels, allEngines, allGearboxes],
        [model, payload, gearbox]
      );

      parts.allCarModels = allCarModels;
      parts.allEngines = allEngines;
      parts.allGearboxes = allGearboxes;

      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: PayloadAction<Gearbox | undefined>) {
      const { engine, model, parts } = state;
      let { allCarModels, allEngines, allGearboxes } = parts;
      state.gearbox = payload;

      [allCarModels, allEngines, allGearboxes] = tree(
        [allCarModels, allEngines, allGearboxes],
        [model, engine, payload]
      );

      parts.allCarModels = allCarModels;
      parts.allEngines = allEngines;
      parts.allGearboxes = allGearboxes;

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
