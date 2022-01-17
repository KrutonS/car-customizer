/* eslint-disable prefer-const */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Color,
  Engine,
  Gearbox,
  Model,
  Part,
  PartsQuery,
  ValidKeys,
} from "../../lib/datocms";
import { UnionToIntersection } from "../../types";
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

const isPartValid = (
  validArray: ObjectWithId[],
  part: Part<boolean>
): boolean => {
  if (part.disabled) return false;
  const foundItem = findById<ObjectWithId | Part>(validArray, part.id);
  return Boolean(foundItem);
};
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
  return regResult[1];
};
const getNameReg = (key: string) => new RegExp(getName(key), "i");
const getValidsArr = <T extends boolean>(parts: Part<T>) => {
  // extends Part<boolean>
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
  // const lookupTree = { [root[0]]: [...root[1]] };
  // const current = lookupTree[root[0]];
  // const lookupTree = root[1].map((p) => connectValids(p as any));

  // function connectValids(
  //   part: Part & Record<string, ObjectWithId[] | Part[]>
  // ): Part<true> {
  //   const validsArr = getValids(part);
  //   const validsPartsEntr = validsArr.map((valids) => {
  //     const connectedParts = idsToParts(valids);
  //     const a = connectedParts[1].map((p) => connectValids(p as any));
  //     return [valids[0], a];
  //   });

  //   const validsParts = Object.fromEntries(validsPartsEntr);
  //   console.log({ part: { ...part, ...validsParts } });
  //   return { ...part, ...validsParts };
  // }
  // console.log(lookupTree);

  // const activesEntries = Object.entries(allActives);
  // activesEntries.forEach(active=>f(active, lookupTree));

  //TODO const disabledParts to push disables?

  allPartsEntries = allPartsEntries.map(([name, parts]) => [
    name,
    parts.map((p) => setDisable(p, false)),
  ]);

  const rootReg = new RegExp(rootName, "i");
  const root = allPartsEntries.find(([name]) => rootReg.test(name))?.[1];
  if (!root) throw new Error("Couldn't find root " + rootName);
	function getChildren(part:Part){
		return getValidsArr(part)?.flatMap(valids=>validsToParts(valids)[1]);
	}
	// function checkIsLinked(partAbove:Part, partBelow:Part){
	// 	let children = getChildren(partAbove);
	// 	while(children){
	// 		const has
	// 	}

	// }
  function mapAbove(active: [string, Part], layer: Part<false>[]): boolean {
    const partNameReg = getNameReg(layer[0].__typename);

    if (findById(layer, active[1].id)) return true;
    if (partNameReg.test(active[0])) return false;
    let hasActiveChild = false;
    layer.forEach((mappingPart) => {
      const children = getChildren(mappingPart);
      if (!children) throw new MismatchError(mappingPart.name, "undefined");

      const isValid = mapAbove(active, children)
        // .map((child) => {
        //   // const layerBelow = validsToParts(valids);
        //   return mapAbove(active, child);
        // })
        // .some((res) => res);
      if (!isValid) mappingPart.disabled = true;
      else hasActiveChild = true;
    });
    return hasActiveChild;
  }

  allActivesEntries.forEach((active) => {
    if (active[1]) {
      console.log(`----${active[0]}----`);

      mapAbove(active as [string, Part], root);
    }
  });

  return Object.fromEntries(allPartsEntries) as PartsQuery;
};

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

      // const parts = { allCarModels, allEngines, allGearboxes, allColors };
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
      // const {allCarModels} = parts
      // const root = Object.entries({allCarModels})[0];
      const root = getRoot();
      const newParts = tree(
        parts,
        { model: payload, engine, gearbox, color },
        root
      );
      // const { allEngines, allGearboxes, allCarModels } = parts;

      // parts.allCarModels = allCarModels;
      // parts.allEngines = allEngines;
      // parts.allGearboxes = allGearboxes;
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
      // const { allCarModels } = parts;
      // const root =
      // parts.allCarModels = allCarModels;
      // parts.allEngines = allEngines;
      // parts.allGearboxes = allGearboxes;
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

      // parts.allCarModels = allCarModels;
      // parts.allEngines = allEngines;
      // parts.allGearboxes = allGearboxes;
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
