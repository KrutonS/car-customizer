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
import styles from "./customizator.module.scss";
import { Color, Part } from "../../lib/datocms";

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
  } = useAppSelector(({ car }) => {
    const { parts, ...pass } = car;
    return { ...pass, ...parts };
  });

  const dispatch = useAppDispatch();

  const btnOnClick = <T extends Part | Color>(
    part: T,
    action: ActionCreatorWithPayload<T | undefined>,
    current: Part | Color | undefined
  ) => {
    let value: T | undefined = part;
    if (part.id === current?.id) value = undefined;
    dispatch(action(value));
  };

  return (
    <section className={styles.customizator}>
      <div className={styles.row}>
        <h3>Models</h3>
        <div className={styles.buttons}>
          {mappedModels.map((m) => {
            const { id, disabled } = m;
            return (
              <PartButton
                key={id}
                part={m}
                isActive={id === model?.id}
                disabled={disabled}
                onClick={() => btnOnClick(m, setModel, model)}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.row}>
        <h3>Engines</h3>
        <div className={styles.buttons}>
          {mappedEngines.map((e) => {
            const { id, disabled } = e;
            return (
              <PartButton
                key={id}
                part={e}
                isActive={id === engine?.id}
                disabled={disabled}
                onClick={() => btnOnClick(e, setEngine, engine)}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.row}>
        <h3>Gearboxes</h3>
        <div className={styles.buttons}>
          {mappedGearboxes.map((g) => {
            const { id, disabled } = g;
            return (
              <PartButton
                key={id}
                part={g}
                isActive={id === gearbox?.id}
                disabled={disabled}
                onClick={() => btnOnClick(g, setGearbox, gearbox)}
              />
            );
          })}
        </div>
      </div>
      <div className={styles.row}>
        <h3>Colors</h3>
        <div className={styles.buttons}>
          {allColors.map((c) => {
            const {
              id,
              name,
              color: { hex },
            } = c;
            return (
              <PartButton
                part={c}
                key={id}
                isActive={id === color?.id}
                aria-label={name}
                onClick={() => btnOnClick(c, setColor, color)}
                style={{ background: hex }}
              >
                {null}
              </PartButton>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Customizator;
