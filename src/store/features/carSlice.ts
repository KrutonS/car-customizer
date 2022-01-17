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

const setDisable = <T extends Part<boolean>>(part: T, disable = true): T => ({
  ...part,
  disabled: disable,
});
const getName = (
  key: string,
  reg = /([A-Z]?[a-z]+?)(e?s?|Record)$/
): string => {
  const regResult = reg.exec(key);
  if (!regResult)
    throw new Error("Failure when parsing key to partName " + key);
  return regResult[1].toLowerCase();
};
const getNameReg = (key: string) => new RegExp(getName(key), "i");
const getValidsArr = <T extends boolean>(parts: Part<T>) => {
  const valids = Object.entries(parts).filter(([name]) =>
    /^valid/i.test(name)
  ) as [string, T extends true ? Part<true>[] : ObjectWithId[]][];
  if (!valids.length) return null;
  return valids;
};

const tree = (
  allParts: PartsQuery,
  allActives: Pick<State, "model" | "engine" | "gearbox" | "color">,
  rootName: "model" | "engine" | "gearbox" | "color"
) => {
  let allPartsEntries = Object.entries({ ...allParts });
  const allActivesEntries = Object.entries(allActives) as [
    string,
    Part | undefined
  ][];

  // Reset all disables
  allPartsEntries = allPartsEntries.map(([name, parts]) => [
    name,
    parts.map((p) => setDisable(p, false)),
  ]);

  const rootReg = new RegExp(rootName, "i");
  const root = allPartsEntries.find(([name]) => rootReg.test(name))?.[1];
  if (!root) throw new Error("Couldn't find root " + rootName);

  const belowMap = new Map<string, boolean>();

  // #region Tree Utils

  const validsToParts = (
    valids: [string, ObjectWithId[]]
  ): [string, Part<false>[]] => {
    const nameReg = getNameReg(valids[0]);
    const partsEntry = allPartsEntries.find(([name]) => nameReg.test(name));
    if (!partsEntry) throw new Error("Couldn't find parts");
    const parts = valids[1].map(({ id }) => {
      const part = findById(partsEntry[1], id);
      if (part === undefined)
        throw new Error(
          `Couldn't find part with id ${id} of ${valids[0]} in ${partsEntry[0]}`
        );

      return part;
    });
    return [partsEntry[0], parts];
  };

  function getChildren(part: Part) {
    return getValidsArr(part)?.flatMap((valids) => validsToParts(valids)[1]);
  }
  const resetBelowMap = () => {
    let part: Part | undefined = root[0];
    while (part) {
      belowMap.set(getName(part.__typename), true);
      const children = getChildren(part);
      part = children?.[0];
    }
  };

  function checkIsLinked(partAbove: Part, partBelow: Part) {
    let children = getChildren(partAbove);
    while (children) {
      const sliceWithActive = getNameReg(children[0].__typename).test(
        partBelow.__typename
      );
      const hasItem = sliceWithActive && findById(children, partBelow.id);
      if (hasItem) return true;
      const next = children.flatMap((ch) => getChildren(ch));
      if (next.includes(undefined)) children = undefined;
      else children = next as Part[];
    }
    return false;
  }

  function mapAbove(active: [string, Part], layer: Part<false>[]): boolean {
    const sliceName = getName(layer[0].__typename).toLowerCase();
    const partNameReg = new RegExp(sliceName, "i");

    // Exclude parts slices from being mapped by mapBelow()
    belowMap.delete(sliceName);

    // return true if layer contains active
    if (findById(layer, active[1].id)) return true;

    // if parts have same type as active, i.e level, return false
    if (partNameReg.test(active[0])) return false;

    let hasActiveChild = false;
    layer.forEach((mappingPart) => {
      const children = getChildren(mappingPart);
      if (!children) throw new MismatchError(mappingPart.name, "undefined");

      const isValid = mapAbove(active, children);
      if (!isValid) mappingPart.disabled = true;
      else hasActiveChild = true;
    });
    return hasActiveChild;
  }

  function mapBelow(active: Part) {
    belowMap.forEach((shouldMap, name) => {
      if (shouldMap) {
        const nameReg = new RegExp(name, "i");
        const mapEntries = allPartsEntries.find(([key]) =>
          nameReg.test(key)
        )?.[1];
        if (!mapEntries)
          throw new Error("Couldn't find entries of name " + name);
        mapEntries.forEach((p) => {
          const isLinked = checkIsLinked(active, p);
          if (!isLinked) p.disabled = true;
        });
      }
    });
  }
  // #endregion

  resetBelowMap();
  // #region mapping loop
  allActivesEntries.forEach((active) => {
    if (active[1]) {
      mapAbove(active as [string, Part], root);
      mapBelow(active[1]);
      resetBelowMap();
    }
  });

  return Object.fromEntries(allPartsEntries) as PartsQuery;
};

function getRoot(): "model" {
  return "model";
}
// #endregion
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
      const parts = tree(dato, { model, engine, gearbox, color }, root);
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
