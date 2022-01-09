import { FC, ReactElement } from "react";
import styles from "./content.module.scss";

interface Props {
  left: ReactElement;
  right: ReactElement;
}

const Content: FC<Props> = ({ left, right }) => {
  return (
    <main className={styles.content}>
      {left}
      {right}
    </main>
  );
};

export default Content;
