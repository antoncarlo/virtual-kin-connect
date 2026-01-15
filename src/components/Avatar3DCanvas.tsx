import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// Viseme mapping for lip sync (ARKit blend shapes)
const VISEME_MAP: Record<string, string> = {
  'A': 'viseme_aa',
  'E': 'viseme_E', 
  'I': 'viseme_I',
  'O': 'viseme_O',
  'U': 'viseme_U',
  'sil': 'viseme_sil',
};

interface AvatarModelProps {
  url: string;
  isSpeaking?: boolean;
  onLoaded?: () => void;
}

function AvatarModel({ url, isSpeaking = false, onLoaded }: AvatarModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const morphMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const timeRef = useRef(0);
  const visemeIndexRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  
  // Clone scene once
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Find morphable mesh and head bone
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        morphMeshRef.current = child;
      }
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        if (name.includes('head') && !name.includes('top') && !name.includes('end')) {
          headBoneRef.current = child;
        }
      }
    });
    
    return clone;
  }, [scene]);

  useEffect(() => {
    if (clonedScene) {
      setIsReady(true);
      onLoaded?.();
    }
  }, [clonedScene, onLoaded]);

  // Lip sync animation
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (!modelRef.current) return;
    
    // Breathing animation
    const breathe = Math.sin(timeRef.current * 1.5) * 0.002;
    modelRef.current.position.y = -0.65 + breathe;
    
    // Subtle body sway
    modelRef.current.rotation.y = Math.sin(timeRef.current * 0.3) * 0.015;
    
    // Head movement
    if (headBoneRef.current) {
      const lookX = Math.sin(timeRef.current * 0.5) * 0.04;
      const lookY = Math.sin(timeRef.current * 0.7) * 0.03;
      headBoneRef.current.rotation.y = lookX;
      headBoneRef.current.rotation.x = lookY;
      
      // Extra movement when speaking
      if (isSpeaking) {
        headBoneRef.current.rotation.x += Math.sin(timeRef.current * 6) * 0.015;
        headBoneRef.current.rotation.z = Math.sin(timeRef.current * 4) * 0.01;
      }
    }
    
    // Lip sync morph targets
    if (morphMeshRef.current && morphMeshRef.current.morphTargetInfluences && morphMeshRef.current.morphTargetDictionary) {
      const morphTargets = morphMeshRef.current.morphTargetInfluences;
      const dictionary = morphMeshRef.current.morphTargetDictionary;
      
      // Reset all visemes
      Object.values(VISEME_MAP).forEach((visemeName) => {
        const index = dictionary[visemeName];
        if (index !== undefined && morphTargets[index] !== undefined) {
          morphTargets[index] = THREE.MathUtils.lerp(morphTargets[index], 0, 0.3);
        }
      });
      
      if (isSpeaking) {
        // Animate through visemes when speaking
        const visemeSpeed = 8;
        const visemePhase = Math.floor(timeRef.current * visemeSpeed) % 6;
        const visemeProgress = (timeRef.current * visemeSpeed) % 1;
        
        const visemes = ['A', 'E', 'I', 'O', 'U', 'sil'];
        const currentViseme = visemes[visemePhase];
        const visemeName = VISEME_MAP[currentViseme];
        
        if (visemeName) {
          const index = dictionary[visemeName];
          if (index !== undefined && morphTargets[index] !== undefined) {
            // Smooth in/out
            const intensity = Math.sin(visemeProgress * Math.PI) * 0.6;
            morphTargets[index] = intensity;
          }
        }
        
        // Add jaw movement via morph target if available
        const jawOpenIndex = dictionary['jawOpen'];
        if (jawOpenIndex !== undefined) {
          morphTargets[jawOpenIndex] = Math.sin(timeRef.current * 10) * 0.3 + 0.1;
        }
        
        // Blink less frequently when speaking
        const blinkIndex = dictionary['eyesClosed'] || dictionary['eyeBlink_L'];
        if (blinkIndex !== undefined && Math.random() < 0.002) {
          morphTargets[blinkIndex] = 1;
          setTimeout(() => {
            if (morphTargets[blinkIndex] !== undefined) {
              morphTargets[blinkIndex] = 0;
            }
          }, 150);
        }
      } else {
        // Idle blinking
        const blinkIndex = dictionary['eyesClosed'] || dictionary['eyeBlink_L'] || dictionary['eyeBlinkLeft'];
        const blinkIndexR = dictionary['eyeBlink_R'] || dictionary['eyeBlinkRight'];
        
        if (Math.random() < 0.003) {
          if (blinkIndex !== undefined) morphTargets[blinkIndex] = 1;
          if (blinkIndexR !== undefined) morphTargets[blinkIndexR] = 1;
          
          setTimeout(() => {
            if (blinkIndex !== undefined && morphTargets[blinkIndex] !== undefined) morphTargets[blinkIndex] = 0;
            if (blinkIndexR !== undefined && morphTargets[blinkIndexR] !== undefined) morphTargets[blinkIndexR] = 0;
          }, 150);
        }
        
        // Subtle mouth movement (idle)
        const mouthSmileIndex = dictionary['mouthSmile'] || dictionary['mouthSmileLeft'];
        if (mouthSmileIndex !== undefined) {
          morphTargets[mouthSmileIndex] = Math.sin(timeRef.current * 0.5) * 0.1 + 0.1;
        }
      }
    }
  });

  if (!isReady) return null;

  return (
    <group ref={modelRef} position={[0, -0.65, 0]} scale={1.2}>
      <primitive object={clonedScene} />
    </group>
  );
}

function Scene({ avatarUrl, isSpeaking, onLoaded }: { avatarUrl: string; isSpeaking?: boolean; onLoaded?: () => void }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0.4, 1.2);
    camera.lookAt(0, 0.2, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[3, 3, 3]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <pointLight position={[0, 2, 0]} intensity={0.3} />
      
      {/* Rim light for better silhouette */}
      <spotLight 
        position={[-2, 2, -2]} 
        intensity={0.5} 
        angle={0.5} 
        penumbra={1}
        color="#6366f1"
      />
      
      <AvatarModel url={avatarUrl} isSpeaking={isSpeaking} onLoaded={onLoaded} />
      
      {/* Environment for reflections */}
      <Environment preset="city" />
      
      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={0.8}
        maxDistance={2.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.2, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

interface Avatar3DCanvasProps {
  avatarUrl: string;
  isSpeaking?: boolean;
  onLoaded?: () => void;
  onError?: () => void;
}

function Avatar3DCanvas({ avatarUrl, isSpeaking = false, onLoaded, onError }: Avatar3DCanvasProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Preload the model
    try {
      useGLTF.preload(avatarUrl);
    } catch (e) {
      console.error('Failed to preload avatar:', e);
    }
  }, [avatarUrl]);

  if (hasError) {
    onError?.();
    return null;
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 1.2], fov: 50 }}
      style={{ 
        width: '100%',
        height: '100%',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e', 1);
      }}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
    >
      <Scene avatarUrl={avatarUrl} isSpeaking={isSpeaking} onLoaded={onLoaded} />
    </Canvas>
  );
}

export default Avatar3DCanvas;
