import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import * as THREE from "three";

interface AvatarModelProps {
  url: string;
  isSpeaking?: boolean;
}

function AvatarModel({ url, isSpeaking = false }: AvatarModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const [headBone, setHeadBone] = useState<THREE.Bone | null>(null);
  const time = useRef(0);
  
  // Clone the scene to avoid conflicts
  const clonedScene = scene.clone();
  
  // Find head bone for animations
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase();
        if (boneName.includes('head') && !boneName.includes('headtop')) {
          setHeadBone(child);
        }
      }
    });
  }, [clonedScene]);

  // Animate the avatar
  useFrame((state, delta) => {
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

  return (
    <group ref={modelRef} position={[0, -1, 0]} scale={1.5}>
      <primitive object={clonedScene} />
    </group>
  );
}

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

interface Avatar3DViewerProps {
  avatarUrl?: string;
  className?: string;
  isSpeaking?: boolean;
}

export function Avatar3DViewer({ avatarUrl, className = "", isSpeaking = false }: Avatar3DViewerProps) {
  const [error, setError] = useState(false);

  if (!avatarUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-xl`}
      >
        <p className="text-muted-foreground">Avatar 3D non disponibile</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-xl`}
      >
        <p className="text-muted-foreground">Errore nel caricamento dell'avatar</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Caricamento avatar 3D...</p>
            </div>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: [0, 0.5, 2], fov: 45 }}
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
          onError={() => setError(true)}
        >
          <Scene avatarUrl={avatarUrl} isSpeaking={isSpeaking} />
        </Canvas>
      </Suspense>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <p className="text-xs text-white/40">Trascina per ruotare • Scroll per zoom</p>
      </div>
    </motion.div>
  );
}

// Preload common avatar models
export function preloadAvatarModel(url: string) {
  useGLTF.preload(url);
}
