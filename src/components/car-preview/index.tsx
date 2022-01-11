import { Mesh } from "three";
import { useEffect, useRef, useState } from "react";
import {
  CameraProps,
  Canvas,
  Euler,
  extend,
  ReactThreeFiber,
  useFrame,
  useLoader,
  useThree,
  Vector3,
} from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Suspense } from "react";
import Spinner from "../spinner";
// function Box(props: JSX.IntrinsicElements["mesh"]) {
//   const ref = useRef<Mesh>(null!);
//   const [hovered, hover] = useState(false);
//   const [clicked, click] = useState(false);
//   useFrame((state, delta) => (ref.current.rotation.x += 0.01));
//   return (
//     <mesh
//       {...props}
//       ref={ref}
//       scale={clicked ? 1.5 : 1}
//       onClick={() => click(!clicked)}
//       onPointerOver={() => hover(true)}
//       onPointerOut={() => hover(false)}
//     >
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial  />
//     </mesh>
//   );
// }
// const useCamera = () => {
//   const [positionX, setPositionX] = useState(0);
//   const [positionY, setPositionY] = useState(0);
//   const [positionZ, setPositionZ] = useState(0);
//   const [rotationX, setRotationX] = useState(0);
//   const [rotationY, setRotationY] = useState(0);
//   const [rotationZ, setRotationZ] = useState(0);

//   const camera: CameraProps = {
//     position: [positionX, positionY, positionZ],
//     rotation: [rotationX, rotationY, rotationZ],
//   };

//   return [
//     camera,
//     {
//       position: {
//         value: [positionX, positionY, positionZ],
//         setPosition: [setPositionX, setPositionY, setPositionZ],
//       },
//       rotation: {
//         value: [rotationX, rotationY, rotationZ],
//         setRotation: [setRotationX, setRotationY, setRotationZ],
//       },
//     },
//   ];
// };
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
    ></orbitControls>
  );
};

const Car = () => {
  const gltf = useLoader(GLTFLoader, "/car.gltf");
  return <primitive object={gltf.scene} />;
};
// type A = Euler
const CarPreview = () => {
  return (
    <>
      <Suspense fallback={<Spinner />}>
        <Canvas
          style={{ width: "100%", height: "300px"}}
          camera={{ position: [-10, 10, 10] }}
        >
          <CameraController />
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Car />
          {/* <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} /> */}
        </Canvas>
      </Suspense>
    </>
  );
};

export default CarPreview;
