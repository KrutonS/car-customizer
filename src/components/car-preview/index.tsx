import { useRef } from "react";
import {
  Canvas,
  extend,
  ReactThreeFiber,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Suspense } from "react";
import Spinner from "../spinner";
import { useAppSelector } from "../../store/hooks";
import styles from "./carPreview.module.scss";
import CarModel from "./Car";
import { Color } from "three";

const canvasHeight = "300px";

extend({ OrbitControls });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<
        OrbitControls,
        typeof OrbitControls
      >;
    }
  }
}

const CameraController = () => {
  const {
    camera,
    gl: { domElement },
  } = useThree();
  const controls = useRef<OrbitControls>();
  useFrame(() => controls.current?.update());
  return (
    <orbitControls
      ref={controls}
      args={[camera, domElement]}
      autoRotate={true}
      autoRotateSpeed={1}
      enableZoom={false}
      enablePan={false}
    ></orbitControls>
  );
};

const CarPreview = () => {
  const hex = useAppSelector(({ car }) => car.color?.color.hex);
  return (
    <div className={styles["car-model"]} style={{ height: canvasHeight }}>
      <Suspense fallback={<Spinner />}>
        <Canvas
          style={{ width: "100%", height: canvasHeight }}
          camera={{ position: [-11, 11, 11] }}
        >
          <CameraController />
          <pointLight color='#adb3ff' position={[1, 15, 2]} intensity={0.5} />
          <Suspense
            fallback={
              <hemisphereLight
                color={0x000000}
                groundColor={new Color(0x080520)}
                intensity={2}
              />
            }
          >
            <Environment preset='night' />
          </Suspense>
          <CarModel hex={hex} />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default CarPreview;
