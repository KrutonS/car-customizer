import cn from "classnames";
import { FC } from "react";
import { Image } from "react-datocms";
import { useAppSelector } from "../../store/hooks";
import {ReactComponent as CarPlaceholder} from '../../assets/car.svg';
import styles from "./summary.module.scss";

type RowProps = { label: string; className?: string };

const Row: FC<RowProps> = ({ label, children, className }) => {
  return (
    <div className={cn(styles.row, className)}>
      <h4 className={styles["keep-h"]}>{label}</h4>
      <span className={styles["keep-h"]}>{children}</span>
    </div>
  );
};

const Summary: FC = () => {
  const { price, color, model, engine, gearbox } = useAppSelector(
    ({ car }) => car
  );

  const imageData = model?.image?.responsiveImage;
		console.log(imageData);
		
  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>Summary</h2>
			<CarPlaceholder className={styles['car-image']}/>
      {/* {imageData?<Image className={styles['car-image']} data={imageData}/> : <CarPlaceholder className={styles['car-image']}/>} */}
      {<Row label='Model'>{model?.name}</Row>}
      {<Row label='Engine'>{engine?.name}</Row>}
      {<Row label='Gearbox'>{gearbox?.name}</Row>}
      {<Row label='Color'>{color?.name}</Row>}
      {<Row label='Price'>{price}</Row>}
    </div>
  );
};

export default Summary;
