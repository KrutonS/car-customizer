import classNames from "classnames";
import { FC } from "react";
import { Engine, Gearbox, Model } from "../../lib/datocms";
import Button from "../button";

interface Props {
  part: Engine | Gearbox | Model | null;
  onClick: VoidFunction;
  isActive: boolean;
	disabled?:boolean;
}

const PartButton: FC<Props> = ({ part, onClick, isActive, disabled }) => {
  // if (part) {
  const { id, name } = part || {};
  return (
    <Button
      key={id}
      onClick={onClick}
      disabled={disabled}
      className={classNames("part-btn", {
        "part-btn--active": isActive,
      })}
    >
      {name}
    </Button>
  );
  // }
  // return null;
};

export default PartButton;
