import { FC } from "react";
import { Engine, Gearbox, Model } from "../lib/datocms";
import {
  setColor,
  setEngine,
  setGearbox,
  setModel,
} from "../store/features/carSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { invalidToNull, ObjectWithId } from "../utils/array";
import Button from "./button";

interface partFilters {
  validModels?: ObjectWithId[];
  validEngines?: ObjectWithId[];
  validGearboxes?: ObjectWithId[];
}

const Customizator: FC = () => {
  const {
    isLoading,
    mappedEngines,
    mappedGearboxes,
    mappedModels,
    color,
    engine,
    gearbox,
    model,
    price,
    allColors,
  } = useAppSelector(({ car }) => {
    const { parts, ...pass } = car;
    const { allColors } = parts;
    return { ...pass, allColors };
  });
	const {allCarModels,allEngines,allGearboxes} = useAppSelector(({car})=>car.parts)

  const dispatch = useAppDispatch();
  // const filteredGearboxes = model?allCarModels:
  // let engines = allEngines;
  // let gearboxes = allGearboxes;
  // if (model !== undefined) {
  //   const { validEngines } = allCarModels[model];
  //   engines = filterById(allEngines, validEngines);
  //   if (engine !== undefined) {
  //     const { validGearboxes } = allEngines[engine];
  //     gearboxes = filterById(allGearboxes, validGearboxes);
  //   } else {
  //     engines.forEach(
  //       ({ validGearboxes }) =>
  //         (gearboxes = filterById(gearboxes, validGearboxes))
  //     );
  //   }
  // }

  // if (model !== undefined) {
  //   const { validEngines } = allCarModels[model];
  //   engines = invalidToNull(allEngines, validEngines);
  //   if (engine !== undefined) {
  //     const { validGearboxes } = allEngines[engine];
  //     gearboxes = invalidToNull(allGearboxes, validGearboxes);
  //   }
  // }
//TODO refactor
  return (
    <div className='customizator'>
			<p>{model} {engine} {gearbox}</p>
			<p>{model!==undefined && allCarModels[model].price} + {engine!==undefined && allEngines[engine].price} + {gearbox!==undefined && allGearboxes[gearbox].price}</p>
      <h4>Price: {price}</h4>
      <h3>Models</h3>
      {mappedModels.map((m, index) => {
        if (m) {
          const { id, name } = m;
          return (
            <Button
              key={id}
              onClick={() => dispatch(setModel(index))}
              disabled={index === model}
            >
              {name}
            </Button>
          );
        }
      })}
      <h3>Engines</h3>
      {mappedEngines.map((e, index) => {
        if (e) {
          const { id, name } = e;
          return (
            <Button
              key={id}
              onClick={() => dispatch(setEngine(index))}
              disabled={index === engine}
            >
              {name}
            </Button>
          );
        }
      })}
      <h3>Gearboxes</h3>
      {mappedGearboxes.map((g, index) => {
        if (g) {
          const { id, name } = g;
          return (
            <Button
              key={id}
              onClick={() => dispatch(setGearbox(index))}
              disabled={index === gearbox}
            >
              {name}
            </Button>
          );
        }
      })}
      <h3>Colors</h3>
      {allColors.map(({ id, color: { hex } }, index) => (
        <Button
          key={id}
          onClick={() => dispatch(setColor(index))}
          disabled={index === color}
        >
          {hex}
        </Button>
      ))}
    </div>
  );
};

export default Customizator;
