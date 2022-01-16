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
  model?: Model;
  engine?: Engine;
  gearbox?: Gearbox;
  color?: Color;
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
  partsArr: PartsQuery,
  active: [Model | undefined, Engine | undefined, Gearbox | undefined],
  root: Part
  // depth = 2
) => {
  //#region Utils
};
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    setParts(state, { payload }: InitPayload) {
      const { dato, paramsIds } = payload;
      const { allCarModels, allEngines, allGearboxes } = dato;
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
      const { allEngines, allGearboxes, allCarModels } = parts;
      state.model = payload;

      parts.allCarModels = allCarModels;
      parts.allEngines = allEngines;
      parts.allGearboxes = allGearboxes;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: PayloadAction<Engine | undefined>) {
      const { parts, model, gearbox } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      state.engine = payload;

      parts.allCarModels = allCarModels;
      parts.allEngines = allEngines;
      parts.allGearboxes = allGearboxes;

      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: PayloadAction<Gearbox | undefined>) {
      const { engine, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      state.gearbox = payload;

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
