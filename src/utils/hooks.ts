import { Color } from "three";
import { useEffect, useRef, useState } from "react";

export function useLerp(from: Color, to: Color, duration = 1, ms = 1000 / 60) {
  const [trans, setTrans] = useState(from);
  const start = useRef(Date.now());

  useEffect(() => {
    start.current = Date.now();
    function onTimeout() {
      const progress = (Date.now() - start.current) / duration / 1000;
      const color = trans.lerp(to, progress);
      setTrans(color);
    }
		
    if (!from.equals(to)) {
      const interval = setInterval(onTimeout, ms);
      const clearInter = () => clearInterval(interval);
      const timeout = setTimeout(clearInter, duration * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [to]);

  return trans;
}
