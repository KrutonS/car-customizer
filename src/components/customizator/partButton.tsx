import classNames from "classnames";
import { FC } from "react";
import { Color, Engine, Gearbox, Model } from "../../lib/datocms";
import Button from "../button";
import styles from "./customizator.module.scss";

interface Props {
  part: Engine | Gearbox | Model | Color;
  onClick: VoidFunction;
  isActive: boolean;
  disabled?: boolean;
}

const PartButton: FC<Props> = ({ part, onClick, isActive, disabled }) => {
  // if (part) {
  let hex;
  if ("color" in part) {
    hex = part.color.hex;
  }
  const { id, name } = part;
  return (
    <Button
      key={id}
      onClick={onClick}
      disabled={disabled}
			data-hex={hex}
      className={classNames(styles["part-btn"], {
        "btn--active": isActive,
        [styles["part-btn--active"]]: isActive,
        [styles["part-btn--color"]]: hex,
      })}
    >
      {name}
    </Button>
  );
  // }
  // return null;
};

export default PartButton;
