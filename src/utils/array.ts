export type ObjectWithId = { id: string };

export const findIndexById = <T extends ObjectWithId[]>(
  targetArr: T,
  id: string
): number | undefined => {
  const index = targetArr.findIndex(({ id: _id }) => id === _id);
  if (index < 0) return undefined;
  return index;
};
export const findById = <T extends ObjectWithId>(
  targetArr: (T | null)[],
  id: string
): T | undefined => targetArr.find((t) => id === t?.id) as T | undefined;

export const invalidToNull = <T extends ObjectWithId>(
  allArray: T[],
  validArray: ObjectWithId[]
): (T | null)[] =>
  allArray.map((item) => {
    const { id } = item;
    if (findById(validArray, id)) return item;
    return null;
  });
// allArray.filter(({ id }) =>
//   findById(validArray, id)
// ) as T;
// [1,2,3].reduce((a,b)=>a===b, true)
// type ReduceCallback<A> = (
//   previousValue: A[],
//   currentValue: A,
//   currentIndex: number
// ) => A[];
// export function reduceWhile<A>(
//   arr: A[],
//   callback: ReduceCallback<A>,
//   // initialVal: T,
//   check: (acc: A[]) => boolean,
//   reverse?: boolean
// ): A[] {
//   const start = reverse ? arr.length - 1 : 0;
//   let accumulator = [arr[start]];

//   for (let i = start; reverse ? i >= 0 : i < arr.length; reverse ? i-- : i++) {
//     accumulator = callback(accumulator, arr[i], i);
//     if (!check(accumulator)) break;
//   }
//   return accumulator;
// }
