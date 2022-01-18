import { Color } from "three";
import { useEffect, useRef, useState } from "react";

export function useLerp(initial: Color, to: Color, duration = 1) {
  const [trans, setTrans] = useState(initial);
  const start = useRef(0);
  const requestRef = useRef<number>();
	const fromRef = useRef(initial);

  useEffect(() => {
    start.current = Date.now();
		fromRef.current = trans;
		
    function animate() {

      const progress = (Date.now() - start.current) / duration / 1000;
			const fromCopy = fromRef.current.clone();
      const color = fromCopy.lerp(to, progress);
			
      setTrans(color);
      if (progress < 1) requestAnimationFrame(animate);
    }
    if (!trans.equals(to)) {
      requestRef.current = requestAnimationFrame(animate);
			return ()=>cancelAnimationFrame(requestRef.current as number);
    }
  }, [to.getHex()]);

  return trans;
}
