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
import { MismatchError } from "../../utils/errors";
import { tree } from "../../utils/tree";

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

export type ParamsIds = { [k: string]: string | null };
type PickProp<P extends keyof State> = Required<State>[P];
type InitPayload = PayloadAction<{
  dato: PickProp<"parts">;
  paramsIds: ParamsIds;
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

function getRoot(): "model" {
  return "model";
}
// #endregion

const carSlice = createSlice({
  name: "car",
  initialState,
  reducers: {
    setParts(state, { payload }: InitPayload) {
      const { dato, paramsIds } = payload;
      const partsEntries = Object.entries(dato);
      const paramEntries = Object.entries(paramsIds);
      const { model, engine, gearbox, color } = paramEntries.reduce(
        (paramsObj, [partName, id]) => {
          if (id !== null) {
            const nameReg = new RegExp(partName, "i");
            const lookupParts = partsEntries.find(([n]) => nameReg.test(n));
            if (!lookupParts)
              throw new Error("Failed finding part slice for " + partName);
            const foundItem = findById(lookupParts[1], id);
            if (!foundItem)
              throw new Error(
                "failed finding part of id " + id + " in " + lookupParts[0]
              );
            return { ...paramsObj, [partName]: foundItem };
          }
          return paramsObj;
        },
        {} as { [k: string]: Part }
      ) as Pick<State, "model" | "engine" | "gearbox" | "color">;

      const root = getRoot();
      const parts = tree<Part, PartsQuery>(dato, { model, engine, gearbox }, root);
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
      state.model = payload;

      const { engine, gearbox, color, parts } = state;
      const root = getRoot();
      const newParts = tree(
        parts,
        { model: payload, engine, gearbox, color },
        root
      );

      state.parts = newParts;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: PayloadAction<Engine | undefined>) {
      state.engine = payload;
      const { parts, model, gearbox, color } = state;
      const root = getRoot();
      const newParts = tree(
        parts,
        { model, engine: payload, gearbox, color },
        root
      );
      state.parts = newParts;
      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: PayloadAction<Gearbox | undefined>) {
      state.gearbox = payload;
      const { engine, model, color, parts } = state;
      const root = getRoot();
      const newParts = tree(
        parts,
        { model, engine, gearbox: payload, color },
        root
      );

      state.parts = newParts;
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
