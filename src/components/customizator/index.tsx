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
import styles from './customizator.module.scss'

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
    // allCarModels,
    // allEngines,
    // allGearboxes,
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

  return (
    <section className={styles.customizator}>
      <div className={styles.row}>
				<h3>Models</h3><div className={styles.buttons}>
					
					{mappedModels.map((m, index) => {
						return (
							<PartButton
								//No reordering, so this is okay
								key={index}
								///
								part={m}
								isActive={index === model}
								disabled={mappedModels[index].disabled}
								onClick={() => btnOnClick(index, setModel, model)}
							/>
						);
					})}
				</div>
			</div>
      <div className={styles.row}>
				<h3>Engines</h3>
				<div className={styles.buttons}>
					{mappedEngines.map((e, index) => {
						return (
							<PartButton
								key={index}
								part={e}
								isActive={index === engine}
								disabled={mappedEngines[index].disabled}
								onClick={() => btnOnClick(index, setEngine, engine)}
							/>
						);
					})}
				</div>
			</div>
      <div className={styles.row}>
      <h3>Gearboxes</h3>
      <div className={styles.buttons}>
				{mappedGearboxes.map((g, index) => {
					return (
						<PartButton
							key={index}
							part={g}
							isActive={index === gearbox}
							disabled={mappedGearboxes[index].disabled}
							onClick={() => btnOnClick(index, setGearbox, gearbox)}
						/>
					);
				})}
			</div>
			</div>
      <div className={styles.row}>
				<h3>Colors</h3>
				<div className={styles.buttons}>
					{allColors.map((c, index) => (
						<PartButton
							part={c}
							key={c.id}
										isActive={index === color}
							onClick={() => btnOnClick(index, setColor, color)}
						/>
					))}
				</div>
			</div>
    </section>
  );
};

export default Customizator;
