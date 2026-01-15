import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ReadyPlayerMeAvatarProps {
  avatarUrl?: string;
  onAvatarCreated?: (url: string) => void;
  className?: string;
  showCreator?: boolean;
}

const DEFAULT_AVATAR_URL = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb";

export function ReadyPlayerMeAvatar({
  avatarUrl,
  onAvatarCreated,
  className = "",
  showCreator = false,
}: ReadyPlayerMeAvatarProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl || DEFAULT_AVATAR_URL);

  // Handle messages from Ready Player Me iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://readyplayer.me") return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        if (data.source === "readyplayerme") {
          if (data.eventName === "v1.avatar.exported") {
            const newAvatarUrl = data.data.url;
            setCurrentAvatarUrl(newAvatarUrl);
            onAvatarCreated?.(newAvatarUrl);
            setIsLoading(false);
          }
          
          if (data.eventName === "v1.frame.ready") {
            // Frame is ready, send configuration
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                target: "readyplayerme",
                type: "subscribe",
                eventName: "v1.**",
              }),
              "*"
            );
          }
        }
      } catch (error) {
        console.error("Error parsing RPM message:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAvatarCreated]);

  // Load 3D avatar viewer
  useEffect(() => {
    if (!showCreator && currentAvatarUrl && canvasRef.current) {
      loadAvatarViewer();
    }
  }, [currentAvatarUrl, showCreator]);

  const loadAvatarViewer = async () => {
    setIsLoading(true);
    
    try {
      // Load Three.js and GLTFLoader dynamically
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set up scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        30,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1.5, 3);

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
      });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const fillLight = new THREE.DirectionalLight(0x9b87f5, 0.3);
      fillLight.position.set(-5, 0, -5);
      scene.add(fillLight);

      // Controls
      const controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 1.2, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.5;
      controls.maxDistance = 5;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.update();

      // Load avatar
      const loader = new GLTFLoader();
      loader.load(
        currentAvatarUrl,
        (gltf) => {
          const avatar = gltf.scene;
          avatar.position.set(0, 0, 0);
          scene.add(avatar);
          setIsLoading(false);

          // Animation loop
          const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          };
          animate();
        },
        undefined,
        (error) => {
          console.error("Error loading avatar:", error);
          setIsLoading(false);
        }
      );

      // Handle resize
      const handleResize = () => {
        if (!canvas) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
      };
    } catch (error) {
      console.error("Error loading 3D viewer:", error);
      setIsLoading(false);
    }
  };

  if (showCreator) {
    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="https://readyplayer.me/avatar?frameApi"
          className="w-full h-full border-0 rounded-xl"
          allow="camera *; microphone *; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ touchAction: "none" }}
      />
    </motion.div>
  );
}
