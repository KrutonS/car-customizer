import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Engine,
  Gearbox,
  Model,
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

type NumberPayload = PayloadAction<number>;

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
  part: Model | Engine | Gearbox
): boolean => Boolean(findById(validArray, part.id));

const mapParts = <T extends Model | Engine | Gearbox>(
  parts: T[],
  vArr: ObjectWithId[]
): (T | null)[] => {
  const mappedArr = parts.map((p) => {
    const isValid = isPartValid(vArr, p);
    return isValid ? p : null;
  });
  return mappedArr;
};

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
    setModel(state, { payload }: NumberPayload) {
      const { engine, gearbox, parts } = state;
      const { allEngines, allGearboxes } = parts;
      let { validEngines } = parts.allCarModels[payload];

      if (gearbox !== undefined) {
        validEngines = validEngines.filter(({ id }) => {
          const e = findById(allEngines, id);
          if (e) return isPartValid(e.validGearboxes, allGearboxes[gearbox]);
          return false;
        });
      }

      const mappedEngines = mapParts(allEngines, validEngines);
      const mappedGearboxes = allGearboxes.map((g) => {
        let isSelEnginValid = true;
        if (engine!==undefined){
          isSelEnginValid = isPartValid(allEngines[engine].validGearboxes, g);
				}
        const isValid =
          isSelEnginValid &&
          mappedEngines.some((e) => {
            if (e) {
              const { validGearboxes } = e;
              return isPartValid(validGearboxes, g);
            }
            return false;
          });
        return isValid ? g : null;
      });

      state.mappedEngines = mappedEngines;
      state.mappedGearboxes = mappedGearboxes;

      const engineIsValid = engine !== undefined && mappedEngines[engine];
      const gearboxIsValid = gearbox !== undefined && mappedGearboxes[gearbox];

      state.model = payload;
      if (!engineIsValid) state.engine = undefined;
      if (!gearboxIsValid) state.gearbox = undefined;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: NumberPayload) {
      const { gearbox, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      const { validGearboxes } = allEngines[payload];

      const mappedGearboxes = allGearboxes.map((e) =>
        isPartValid(validGearboxes, e) ? e : null
      );
      const mappedModels = allCarModels.map((m) => {
        if (m) {
          const { validEngines } = m;
          const isValid = isPartValid(validEngines, allEngines[payload]);
          if (isValid) return m;
        }
        return null;
      });
      state.mappedGearboxes = mappedGearboxes;
      state.mappedModels = mappedModels;

      const modelIsValid = model !== undefined && mappedModels[model];

      const gearboxIsValid = gearbox !== undefined && mappedGearboxes[gearbox];

      state.engine = payload;
      if (!modelIsValid) state.model = undefined;
      if (!gearboxIsValid) state.gearbox = undefined;

      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: NumberPayload) {
      const { engine, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;

      const mappedEngines = allEngines.map((e) => {
        if (e) {
          const { validGearboxes } = e;
          let isModelValid = true;
          if (model !== undefined) {
            const modelPart = allCarModels[model];
            const { validEngines } = modelPart;
            isModelValid = isPartValid(validEngines, e);
          }
          const isValid =
            isPartValid(validGearboxes, allGearboxes[payload]) && isModelValid;
          if (isValid) return e;
        }
        return null;
      });

      const mappedModels = allCarModels.map((m) => {
        const { validEngines } = m;
        let isValidEngine = true;
        if (engine) {
          isValidEngine = m.validEngines.some(
            ({ id }) => id === allEngines[engine].id
          );
        }
        const isValid =
          isValidEngine &&
          mappedEngines.some((e) => {
            if (e) return isPartValid(validEngines, e);
            return false;
          });
        return isValid ? m : null;
      });

      const engineIsValid = engine !== undefined && mappedEngines[engine];
      const modelIsValid = model !== undefined && mappedModels[model];

      state.mappedEngines = mappedEngines;
      state.mappedModels = mappedModels;
      state.gearbox = payload;
      if (!engineIsValid) {
        state.engine = undefined;
        alert("");
      }
      if (!modelIsValid) state.model = undefined;

      state.price = updatePrice(state);
      return state;
    },
    setColor(state, { payload }: NumberPayload) {
      return { ...state, color: payload };
    },
  },
});
export const carReducer = carSlice.reducer;
export const { setEngine, setGearbox, setModel, setParts, setColor } =
  carSlice.actions;
