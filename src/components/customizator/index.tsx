import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { FC } from "react";
import { generatePath } from "react-router-dom";
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
import { generateSearchString } from "../../utils/url";
import Button from "../button";
import copyTextToClipboard from "../../utils/copyToClipboard";
import { toast } from "react-toastify";

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
  // const navigate = useNavigate();
  // useEffect(() => {

  // }, [model, engine, gearbox]);

  const partOnClick = <T extends Part | Color>(
    part: T,
    action: ActionCreatorWithPayload<T | undefined>,
    current: Part | Color | undefined
  ) => {
    const { id } = part;
    let value: T | undefined = part;
    if (id === current?.id) value = undefined;
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
                onClick={() => partOnClick(m, setModel, model)}
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
                onClick={() => partOnClick(e, setEngine, engine)}
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
                onClick={() => partOnClick(g, setGearbox, gearbox)}
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
                onClick={() => partOnClick(c, setColor, color)}
                style={{ background: hex }}
              >
                {null}
              </PartButton>
            );
          })}
        </div>
      </div>
      <Button
			className={styles['save-btn']}
        onClick={async () => {
          const newSearchParams = {
            model: model?.id,
            engine: engine?.id,
            gearbox: gearbox?.id,
            color: color?.id,
          };
          const { origin } = window.location;

          const searchUrl = generatePath(
            generateSearchString(newSearchParams),
            newSearchParams
          );

          await copyTextToClipboard(`${origin}/${searchUrl}`);
          toast.success(
            "Generated url copied to clipboard. Use it to restore your work!"
          );
        }}
      >
        Save your work
      </Button>
    </section>
  );
};

export default Customizator;
