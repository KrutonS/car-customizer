import { FC, ReactElement } from "react";
import cn from "../../utils/className";
import styles from "./content.module.scss";

interface Props {
  left: ReactElement;
  right: ReactElement;
}

const Content: FC<Props> = ({ left, right }) => {
  return (
    <div className={cn('center', styles.content)}>
      <main className={styles.main}>
        {left}
        {right}
      </main>
    </div>
  );
};

export default Content;
