import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function Sphere({ position, color, speed, scale }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = clock.elapsedTime * 0.2 * speed;
    mesh.current.rotation.y = clock.elapsedTime * 0.3 * speed;
    mesh.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed) * 0.4;
  });
  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} transparent opacity={0.65} />
    </mesh>
  );
}

function Ring({ radius, color, speed }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = clock.elapsedTime * speed;
    mesh.current.rotation.z = clock.elapsedTime * speed * 0.5;
  });
  return (
    <mesh ref={mesh}>
      <torusGeometry args={[radius, 0.015, 16, 120]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.4} />
    </mesh>
  );
}

function Particles() {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[0.37, 0.64, 0.98], [0.54, 0.36, 0.96], [0.06, 0.71, 0.51]];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }
    return { positions, colors };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.025;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.7} />
    </points>
  );
}

class ErrorBoundary extends React.Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? null : this.props.children; }
}

export default function Scene3D({ height = "100%" }) {
  return (
    <ErrorBoundary>
      <Canvas style={{ height, width: "100%" }} camera={{ position: [0, 0, 7], fov: 55 }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[6, 6, 6]} intensity={1.2} color="#60a5fa" />
          <pointLight position={[-6, -4, -4]} intensity={0.6} color="#a78bfa" />
          <Particles />
          <Sphere position={[-3, 1, -2]} color="#3b82f6" speed={0.8} scale={1.2} />
          <Sphere position={[3, -1, -3]} color="#8b5cf6" speed={1.1} scale={0.9} />
          <Sphere position={[0.5, 2, -4]} color="#10b981" speed={0.6} scale={0.7} />
          <Ring radius={2.6} color="#60a5fa" speed={0.25} />
          <Ring radius={3.8} color="#a78bfa" speed={0.15} />
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}
