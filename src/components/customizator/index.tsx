import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { FC } from "react";
import {
  setColor,
  setEngine,
  setGearbox,
  setModel,
} from "../../store/features/carSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import PartButton from "./partButton";

const Customizator: FC = () => {
  const {
    mappedEngines,
    mappedGearboxes,
    mappedModels,
    color,
    engine,
    gearbox,
    model,
    allColors,
    allCarModels,
    allEngines,
    allGearboxes,
  } = useAppSelector(({ car }) => {
    const { parts, ...pass } = car;
    // const { allColors } = parts;
    return { ...pass, ...parts };
  });

  const dispatch = useAppDispatch();
  const btnOnClick = (
    index: number,
    action: ActionCreatorWithPayload<number | undefined>,
    current: number | undefined
  ) => {
    let value: number | undefined = index;
    if (index === current) value = undefined;
    dispatch(action(value));
  };

  //TODO refactor
  return (
    <div className='customizator'>
      <h3>Models</h3>
      {allCarModels.map((m, index) => {
        return (
          <PartButton
            //No reordering, so this is okay
            key={index}
            ///
            part={m}
            isActive={index === model}
            disabled={!mappedModels[index]}
            onClick={() => btnOnClick(index, setModel, model)}
          />
        );
      })}
      <h3>Engines</h3>
      {allEngines.map((e, index) => {
        return (
          <PartButton
            key={index}
            part={e}
            isActive={index === engine}
            disabled={!mappedEngines[index]}
            onClick={() => btnOnClick(index, setEngine, engine)}
          />
        );
      })}
      <h3>Gearboxes</h3>
      {allGearboxes.map((g, index) => {
        return (
          <PartButton
            key={index}
            part={g}
            isActive={index === gearbox}
            disabled={!mappedGearboxes[index]}
            onClick={() => btnOnClick(index, setGearbox, gearbox)}
          />
        );
      })}
      <h3>Colors</h3>
      {allColors.map((c, index) => (
        <PartButton
          part={c}
          key={c.id}
					isActive={index === color}
          onClick={() => btnOnClick(index, setColor, color)}
        />
      ))}
    </div>
  );
};

export default Customizator;
