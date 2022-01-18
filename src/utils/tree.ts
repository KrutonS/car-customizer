import { findById, ObjectWithId } from "./array";
import { MismatchError } from "./errors";

type MinimalPart = {
  __typename: string;
  id: string;
  name: string;
  disabled?: boolean;
} & { [k: string]: ObjectWithId[] };

const setDisable = <T extends MinimalPart>(part: T, disable = true): T => ({
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
const getValidsArr = <T extends MinimalPart>(parts: T) => {
  const valids = Object.entries(parts).filter(([name]) =>
    /^valid/i.test(name)
  )  as [string, ObjectWithId[]][];
  if (!valids.length) return null;
  return valids;
};

const validsToParts = <T extends MinimalPart>(allEntries:[string,T[]][],valids: [string, ObjectWithId[]]): [string, T[]] => {
	const nameReg = getNameReg(valids[0]);
	const partsEntry = allEntries.find(([name]) => nameReg.test(name));
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
function getChildren<T extends MinimalPart>(part: T, allEntries:[string, T[]][]) {
	return getValidsArr(part)?.flatMap((valids) => validsToParts(allEntries,valids)[1]);
}
function checkIsLinked<T extends MinimalPart>(partAbove: T, partBelow: T, allEntries:[string,T[]][]) {
	let children = getChildren(partAbove, allEntries);
	while (children) {
		const sliceWithActive = getNameReg(children[0].__typename).test(
			partBelow.__typename
		);
		const hasItem = sliceWithActive && findById(children, partBelow.id);
		if (hasItem) return true;
		const next = children.flatMap((ch) => getChildren(ch, allEntries));
		if (next.includes(undefined)) children = undefined;
		else children = next as T[];
	}
	return false;
}




export const tree = <T extends MinimalPart, Y extends  {[k: string]: T[]} >(
  allParts: Y,
  allActives: { [k: string]: T | undefined },
  // allActives: Pick<State, "model" | "engine" | "gearbox" | "color">,
  rootName: "model" | "engine" | "gearbox" | "color"
): Y => {
  let allPartsEntries = Object.entries({ ...allParts });
  const allActivesEntries = Object.entries(allActives) as [
    string,
    T | undefined
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



  
  const resetBelowMap = () => {
    let part: T | undefined = root[0];
    while (part) {
      belowMap.set(getName(part.__typename), true);
      const children:T[]|undefined = getChildren(part, allPartsEntries);
      part = children?.[0];
    }
  };

  

  function mapAbove(active: [string, T], layer: T[]): boolean {
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
      const children = getChildren(mappingPart,allPartsEntries);
      if (!children) throw new MismatchError(mappingPart.name, "undefined");

      const isValid = mapAbove(active, children);
      if (!isValid) mappingPart.disabled = true;
      else hasActiveChild = true;
    });
    return hasActiveChild;
  }

  function mapBelow(active: T) {
    belowMap.forEach((shouldMap, name) => {
      if (shouldMap) {
        const nameReg = new RegExp(name, "i");
        const mapEntries = allPartsEntries.find(([key]) =>
          nameReg.test(key)
        )?.[1];
        if (!mapEntries)
          throw new Error("Couldn't find entries of name " + name);
        mapEntries.forEach((p) => {
          const isLinked = checkIsLinked(active, p, allPartsEntries);
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
      mapAbove(active as [string, T], root);
      mapBelow(active[1]);
      resetBelowMap();
    }
  });

  return Object.fromEntries(allPartsEntries) as Y;
};
