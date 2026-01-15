import { useRef, useEffect, useState, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

interface AvatarModelProps {
  url: string;
  isSpeaking?: boolean;
}

const AvatarModel = memo(function AvatarModel({ url, isSpeaking = false }: AvatarModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const [headBone, setHeadBone] = useState<THREE.Bone | null>(null);
  const time = useRef(0);
  const clonedSceneRef = useRef<THREE.Group | null>(null);
  
  // Clone scene only once
  useEffect(() => {
    clonedSceneRef.current = scene.clone() as THREE.Group;
    
    // Find head bone
    clonedSceneRef.current.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('head') && !boneName.includes('headtop')) {
          setHeadBone(child);
        }
      }
    });
  }, [scene]);

  // Animate the avatar
  useFrame((_, delta) => {
    time.current += delta;
    
    if (modelRef.current) {
      // Subtle idle breathing animation
      const breathe = Math.sin(time.current * 1.5) * 0.003;
      modelRef.current.position.y = -1 + breathe;
      
      // Subtle body sway
      modelRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.02;
    }
    
    if (headBone) {
      // Subtle head movement - looking around naturally
      const lookX = Math.sin(time.current * 0.7) * 0.05;
      const lookY = Math.sin(time.current * 0.5) * 0.03;
      headBone.rotation.x = lookY;
      headBone.rotation.y = lookX;
      
      // Speaking animation - subtle head movement
      if (isSpeaking) {
        headBone.rotation.x += Math.sin(time.current * 8) * 0.02;
        headBone.rotation.z = Math.sin(time.current * 6) * 0.01;
      }
    }
  });

  if (!clonedSceneRef.current) return null;

  return (
    <group ref={modelRef} position={[0, -1, 0]} scale={1.5}>
      <primitive object={clonedSceneRef.current} />
    </group>
  );
});

function Scene({ avatarUrl, isSpeaking }: { avatarUrl: string; isSpeaking?: boolean }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0.5, 2);
    camera.lookAt(0, 0.3, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.5} penumbra={1} />
      
      <AvatarModel url={avatarUrl} isSpeaking={isSpeaking} />
      
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />
      
      <Environment preset="apartment" />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

interface Avatar3DCanvasProps {
  avatarUrl: string;
  isSpeaking?: boolean;
  onError?: () => void;
}

function Avatar3DCanvas({ avatarUrl, isSpeaking = false, onError }: Avatar3DCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 2], fov: 45 }}
      style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        width: '100%',
        height: '100%'
      }}
      onError={onError}
    >
      <Scene avatarUrl={avatarUrl} isSpeaking={isSpeaking} />
    </Canvas>
  );
}

export default Avatar3DCanvas;
