import { Color, MeshStandardMaterial } from "three";
import { useRef } from "react";
import {
  Canvas,
  extend,
  ReactThreeFiber,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Suspense } from "react";
import Spinner from "../spinner";
import { useAppSelector } from "../../store/hooks";

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
    ></orbitControls>
  );
};

const Car = ({ color }: { color?: string }) => {
  const gltf = useLoader(GLTFLoader, "/car.gltf");
  console.log(gltf);
  if (color)
    (gltf.materials["Body"] as MeshStandardMaterial).color = new Color(color);
  return <primitive object={gltf.scene} />;
};
const CarPreview = () => {
  const color = useAppSelector(({ car }) => car.color?.color.hex);
  return (
    <>
      <Suspense fallback={<Spinner />}>
        <Canvas
          style={{ width: "100%", height: "300px" }}
          camera={{ position: [-11, 11, 11] }}
        >
          <CameraController />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Car color={color} />
        </Canvas>
      </Suspense>
    </>
  );
};

export default CarPreview;
