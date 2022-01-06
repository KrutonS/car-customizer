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

type UndefNumPayl = PayloadAction<number | undefined>;

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
const gearByEngine = (
  allGearboxes: Gearbox[],
  mappedEngines: (Engine | null)[],
  engine: number
) =>
  allGearboxes.map((g) => {
    let isSelEnginValid = true;
    if (engine !== undefined) {
      isSelEnginValid = isPartValid(
        (mappedEngines[engine] as Engine).validGearboxes,
        g
      );
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
const modelsByEngine = (allCarModels: Model[], engine: Engine) =>
  allCarModels.map((m) => {
    if (m) {
      const { validEngines } = m;
      const isValid = isPartValid(validEngines, engine);
      if (isValid) return m;
    }
    return null;
  });
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
      const { allEngines, allGearboxes } = parts;
      // let { mappedEngines, mappedGearboxes } = state;
      let mappedEngines: (Engine | null)[] = allEngines;
      let mappedGearboxes: (Gearbox | null)[] = allGearboxes;
      console.log(payload);
      state.model = payload;

      if (payload !== undefined) {
        let { validEngines } = parts.allCarModels[payload];

        // narrow validEngines
        if (gearbox !== undefined) {
          validEngines = validEngines.filter(({ id }) => {
            const e = findById(allEngines, id);
            if (e) return isPartValid(e.validGearboxes, allGearboxes[gearbox]);
            return false;
          });
        }

        mappedEngines = mapParts(allEngines, validEngines);
        if (engine !== undefined)
          mappedGearboxes = gearByEngine(allGearboxes, mappedEngines, engine);

        // clearIfInvalid(state, engine, mappedEngines, "engine");
        // clearIfInvalid(state, gearbox, mappedGearboxes, "gearbox");
      }
      state.mappedEngines = mappedEngines;
      state.mappedGearboxes = mappedGearboxes;
      state.price = updatePrice(state);
      return state;
    },
    setEngine(state, { payload }: UndefNumPayl) {
      const { parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      let mappedModels: (Model | null)[] = allCarModels;
      let mappedGearboxes: (Gearbox | null)[] = allGearboxes;
      state.engine = payload;
      console.log(payload);
      if (payload !== undefined) {
        const { validGearboxes } = allEngines[payload];

        mappedGearboxes = mapParts(allGearboxes, validGearboxes);
        mappedModels = modelsByEngine(allCarModels, allEngines[payload]);

        // clearIfInvalid(state, model, mappedModels, "model");
        // clearIfInvalid(state, gearbox, mappedGearboxes, "gearbox");
      }
      state.mappedGearboxes = mappedGearboxes; //modelsByEngine()
      state.mappedModels = mappedModels;
      state.price = updatePrice(state);
      return state;
    },
    setGearbox(state, { payload }: UndefNumPayl) {
      const { engine, model, parts } = state;
      const { allCarModels, allEngines, allGearboxes } = parts;
      let mappedEngines: (Engine | null)[] = allEngines;
      let mappedModels: (Model | null)[] = allCarModels;

      state.gearbox = payload;
      console.log(payload);
      if (payload !== undefined) {
        mappedEngines = enginesByModelGearbox(
          allEngines,
          allCarModels,
          model,
          allGearboxes[payload]
        );
      }
      if (engine !== undefined) {
        mappedModels = modelsByEngine(allCarModels, allEngines[engine]);
        // clearIfInvalid(state, engine, mappedEngines, "engine");
      }
      // if (model !== undefined)
      // clearIfInvalid(state, model, mappedModels, "model");

      state.mappedEngines = mappedEngines;
      state.mappedModels = mappedModels;
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
