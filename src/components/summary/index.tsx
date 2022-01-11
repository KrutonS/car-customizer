import cn from "classnames";
import { FC } from "react";
import { useAppSelector } from "../../store/hooks";
import styles from "./summary.module.scss";
import CarPreview from "../car-preview";

type RowProps = { label: string; className?: string };

const Row: FC<RowProps> = ({ label, children, className }) => {
  return (
    <div key={children + ''} className={cn(styles.row, className)}>
      <h4 className={styles["keep-h"]}>{children?label:''}</h4>
      <span className={styles["keep-h"]}>{children}</span>
    </div>
  );
};

const Summary: FC = () => {
  const { price, color, model, engine, gearbox } = useAppSelector(
    ({ car }) => car
  );

		
  return (
    <section className={styles.summary}>
      <h2 className={styles.title}>Summary</h2>
			<CarPreview/>
      {<Row label='Model'>{model?.name}</Row>}
      {<Row label='Engine'>{engine?.name}</Row>}
      {<Row label='Gearbox'>{gearbox?.name}</Row>}
      {<Row label='Color'>{color?.name}</Row>}
      {<Row label='Price' className={styles.price}>{`$ ${price||0}`}</Row>}
    </section>
  );
};

export default Summary;
