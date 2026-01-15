import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// Extended viseme mapping for more natural lip sync
const VISEME_SEQUENCE = [
  { name: 'viseme_aa', duration: 0.12, intensity: 0.7 },
  { name: 'viseme_O', duration: 0.1, intensity: 0.6 },
  { name: 'viseme_E', duration: 0.08, intensity: 0.5 },
  { name: 'viseme_I', duration: 0.1, intensity: 0.4 },
  { name: 'viseme_U', duration: 0.09, intensity: 0.55 },
  { name: 'viseme_sil', duration: 0.06, intensity: 0.1 },
];

interface AvatarModelProps {
  url: string;
  isSpeaking?: boolean;
  onLoaded?: () => void;
}

function AvatarModel({ url, isSpeaking = false, onLoaded }: AvatarModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const morphMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  
  const timeRef = useRef(0);
  const visemeTimeRef = useRef(0);
  const currentVisemeRef = useRef(0);
  const lastBlinkRef = useRef(0);
  const targetLookRef = useRef({ x: 0, y: 0 });
  const smoothLookRef = useRef({ x: 0, y: 0 });
  
  const [isReady, setIsReady] = useState(false);
  
  // Clone scene once
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Find morphable mesh and bones
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        morphMeshRef.current = child;
      }
      if (child instanceof THREE.Bone) {
        const name = child.name.toLowerCase();
        if (name.includes('head') && !name.includes('top') && !name.includes('end')) {
          headBoneRef.current = child;
        }
        if (name.includes('spine') && !name.includes('1') && !name.includes('2')) {
          spineBoneRef.current = child;
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

  // Smooth lerp helper
  const smoothLerp = useCallback((current: number, target: number, factor: number) => {
    return current + (target - current) * factor;
  }, []);

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (!modelRef.current) return;
    
    // Breathing animation - gentle chest movement
    const breathPhase = timeRef.current * 1.2;
    const breathAmount = Math.sin(breathPhase) * 0.003;
    modelRef.current.position.y = -0.65 + breathAmount;
    
    // Subtle body sway for liveliness
    const swayAmount = Math.sin(timeRef.current * 0.4) * 0.008;
    modelRef.current.rotation.y = swayAmount;
    
    // Random look direction changes
    if (Math.random() < 0.003) {
      targetLookRef.current = {
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.06,
      };
    }
    
    // Smooth look interpolation
    smoothLookRef.current.x = smoothLerp(smoothLookRef.current.x, targetLookRef.current.x, 0.02);
    smoothLookRef.current.y = smoothLerp(smoothLookRef.current.y, targetLookRef.current.y, 0.02);
    
    // Head movement
    if (headBoneRef.current) {
      const baseHeadY = smoothLookRef.current.x;
      const baseHeadX = smoothLookRef.current.y;
      
      if (isSpeaking) {
        // More animated head when speaking
        headBoneRef.current.rotation.y = baseHeadY + Math.sin(timeRef.current * 3) * 0.02;
        headBoneRef.current.rotation.x = baseHeadX + Math.sin(timeRef.current * 4) * 0.015;
        headBoneRef.current.rotation.z = Math.sin(timeRef.current * 2.5) * 0.01;
      } else {
        headBoneRef.current.rotation.y = baseHeadY;
        headBoneRef.current.rotation.x = baseHeadX;
        headBoneRef.current.rotation.z = 0;
      }
    }
    
    // Morph target animations
    if (morphMeshRef.current?.morphTargetInfluences && morphMeshRef.current?.morphTargetDictionary) {
      const morphTargets = morphMeshRef.current.morphTargetInfluences;
      const dictionary = morphMeshRef.current.morphTargetDictionary;
      
      // Reset all visemes smoothly
      VISEME_SEQUENCE.forEach(({ name }) => {
        const index = dictionary[name];
        if (index !== undefined && morphTargets[index] !== undefined) {
          morphTargets[index] = smoothLerp(morphTargets[index], 0, 0.2);
        }
      });
      
      if (isSpeaking) {
        visemeTimeRef.current += delta;
        
        // Get current viseme
        const currentViseme = VISEME_SEQUENCE[currentVisemeRef.current];
        
        // Progress through viseme
        if (visemeTimeRef.current >= currentViseme.duration) {
          visemeTimeRef.current = 0;
          currentVisemeRef.current = (currentVisemeRef.current + 1) % VISEME_SEQUENCE.length;
        }
        
        // Calculate smooth intensity with easing
        const progress = visemeTimeRef.current / currentViseme.duration;
        const eased = Math.sin(progress * Math.PI); // Smooth in/out
        const intensity = eased * currentViseme.intensity;
        
        // Apply current viseme
        const visemeIndex = dictionary[currentViseme.name];
        if (visemeIndex !== undefined && morphTargets[visemeIndex] !== undefined) {
          morphTargets[visemeIndex] = intensity;
        }
        
        // Jaw movement - natural speech patterns
        const jawIndex = dictionary['jawOpen'] || dictionary['mouthOpen'];
        if (jawIndex !== undefined) {
          const jawIntensity = Math.abs(Math.sin(timeRef.current * 12)) * 0.25 + 
                              Math.abs(Math.sin(timeRef.current * 7)) * 0.15;
          morphTargets[jawIndex] = smoothLerp(morphTargets[jawIndex], jawIntensity, 0.3);
        }
        
        // Reduce blink frequency when speaking
        if (timeRef.current - lastBlinkRef.current > 4 && Math.random() < 0.01) {
          performBlink(dictionary, morphTargets);
          lastBlinkRef.current = timeRef.current;
        }
      } else {
        // Idle state
        
        // Natural blinking (every 2-5 seconds)
        if (timeRef.current - lastBlinkRef.current > 2.5 && Math.random() < 0.015) {
          performBlink(dictionary, morphTargets);
          lastBlinkRef.current = timeRef.current;
        }
        
        // Subtle smile
        const smileIndex = dictionary['mouthSmile'] || dictionary['mouthSmileLeft'];
        if (smileIndex !== undefined) {
          const smileAmount = Math.sin(timeRef.current * 0.3) * 0.08 + 0.12;
          morphTargets[smileIndex] = smoothLerp(morphTargets[smileIndex], smileAmount, 0.05);
        }
        
        // Subtle brow movement
        const browIndex = dictionary['browInnerUp'];
        if (browIndex !== undefined) {
          const browAmount = Math.sin(timeRef.current * 0.5) * 0.05;
          morphTargets[browIndex] = smoothLerp(morphTargets[browIndex], browAmount, 0.03);
        }
      }
    }
  });

  const performBlink = (dictionary: Record<string, number>, morphTargets: number[]) => {
    const blinkL = dictionary['eyeBlinkLeft'] || dictionary['eyeBlink_L'] || dictionary['eyesClosed'];
    const blinkR = dictionary['eyeBlinkRight'] || dictionary['eyeBlink_R'];
    
    // Quick blink animation
    if (blinkL !== undefined) morphTargets[blinkL] = 1;
    if (blinkR !== undefined) morphTargets[blinkR] = 1;
    
    setTimeout(() => {
      if (blinkL !== undefined && morphTargets[blinkL] !== undefined) morphTargets[blinkL] = 0;
      if (blinkR !== undefined && morphTargets[blinkR] !== undefined) morphTargets[blinkR] = 0;
    }, 120);
  };

  if (!isReady) return null;

  return (
    <group ref={modelRef} position={[0, -0.65, 0]} scale={1.3}>
      <primitive object={clonedScene} />
    </group>
  );
}

function Scene({ avatarUrl, isSpeaking, onLoaded }: { avatarUrl: string; isSpeaking?: boolean; onLoaded?: () => void }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0.35, 1.1);
    camera.lookAt(0, 0.25, 0);
  }, [camera]);

  return (
    <>
      {/* Three-point lighting for cinematic look */}
      <ambientLight intensity={0.4} />
      
      {/* Key light - main illumination */}
      <directionalLight 
        position={[2, 3, 3]} 
        intensity={1.0} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        color="#ffffff"
      />
      
      {/* Fill light - soften shadows */}
      <directionalLight 
        position={[-2, 1, 1]} 
        intensity={0.4} 
        color="#e0e7ff"
      />
      
      {/* Back/rim light - separation from background */}
      <spotLight 
        position={[-1, 2, -2]} 
        intensity={0.6} 
        angle={0.4} 
        penumbra={1}
        color="#818cf8"
      />
      
      {/* Top accent */}
      <pointLight 
        position={[0, 3, 0]} 
        intensity={0.2} 
        color="#c4b5fd"
      />
      
      <AvatarModel url={avatarUrl} isSpeaking={isSpeaking} onLoaded={onLoaded} />
      
      {/* Environment for realistic reflections */}
      <Environment preset="city" />
      
      {/* Interactive controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={0.7}
        maxDistance={2.0}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.25, 0]}
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
      setHasError(true);
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
      camera={{ position: [0, 0.35, 1.1], fov: 45 }}
      style={{ 
        width: '100%',
        height: '100%',
      }}
      gl={{ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e', 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
    >
      <Scene avatarUrl={avatarUrl} isSpeaking={isSpeaking} onLoaded={onLoaded} />
    </Canvas>
  );
}

export default Avatar3DCanvas;
