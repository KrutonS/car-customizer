import {PacmanLoader} from 'react-spinners';
import { FC } from 'react';
import styles from './spinner.module.scss'

const Spinner: FC = () => {
return (
	<div className={styles.spinner}>
		<PacmanLoader color='hsl(42, 64%, 46%)' />
	</div>
);
};

export default Spinner;