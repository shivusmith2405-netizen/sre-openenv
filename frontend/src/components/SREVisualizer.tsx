import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Float, Text, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

interface Service {
  name: string
  status: 'RUNNING' | 'ERROR' | 'OFFLINE'
  cpu_load: number
}

function Monolith({ name, status, position, cpu }: { name: string, status: string, position: [number, number, number], cpu: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    // Status-based coloring and effects
    let color = new THREE.Color('#00ff41') // Neon Green (RUNNING)
    let emissiveIntensity = 1.5

    if (status === 'ERROR') {
      const pulse = Math.sin(state.clock.elapsedTime * 6) * 0.5 + 0.5
      color = new THREE.Color('#ff003c') // Pulsing Red (ERROR)
      emissiveIntensity = 2.0 * pulse + 0.5
    } else if (status === 'OFFLINE') {
      color = new THREE.Color('#444') // Gray (OFFLINE)
      emissiveIntensity = 0.2
    }

    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      meshRef.current.material.color.set(color)
      meshRef.current.material.emissive.set(color)
      meshRef.current.material.emissiveIntensity = emissiveIntensity
    }

    // Scale slightly based on CPU load
    const targetScale = 1 + (cpu / 100) * 0.2
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial 
          metalness={0.9} 
          roughness={0.1} 
          transparent 
          opacity={0.8}
        />
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </mesh>
    </Float>
  )
}

function GridFloor() {
  return (
    <Grid
      renderOrder={-1}
      position={[0, -1, 0]}
      infiniteGrid
      cellSize={1}
      cellThickness={0.5}
      sectionSize={3}
      sectionThickness={1}
      sectionColor="#00d2ff"
      fadeDistance={30}
    />
  )
}

export function SREVisualizer() {
  const [data, setData] = useState<{ services: Service[], reward: number }>({
    services: [
      { name: 'API', status: 'RUNNING', cpu_load: 20 },
      { name: 'DB', status: 'RUNNING', cpu_load: 15 },
      { name: 'Auth', status: 'RUNNING', cpu_load: 10 }
    ],
    reward: 1.0
  })
  const [logs, setLogs] = useState<string[]>(["System initialized...", "Establishing backend connection..."])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:8000/state')
        const stateData = await response.json()
        const rewardRes = await fetch('http://localhost:8000/reward')
        const rewardData = await rewardRes.json()
        
        setData({ services: stateData.services, reward: rewardData.reward })
        
        // Log changes
        stateData.services.forEach((s: Service) => {
          if (s.status === 'ERROR') {
             setLogs(prev => [ `CRITICAL: ${s.name} is reporting errors!`, ...prev.slice(0, 4)])
          }
        })
      } catch (e) {
        console.error("Backend fetch failed")
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
      {/* 3D Scene */}
      <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {data.services.map((service, idx) => (
          <Monolith 
            key={service.name}
            name={service.name} 
            status={service.status} 
            cpu={service.cpu_load}
            position={[(idx - 1) * 3, 0, 0]}
          />
        ))}

        <GridFloor />
        <OrbitControls makeDefault />

        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.2} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* HUD: Reward Score & Event Log */}
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
        {/* Reward Score */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-64 shadow-2xl">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Environmental Reward</h2>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              {data.reward.toFixed(2)}
            </span>
            <span className="text-gray-500 text-sm mb-1">/ 1.0</span>
          </div>
          <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500" 
              style={{ width: `${data.reward * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-80 shadow-2xl">
          <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Live Event Log</h2>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-48 scrollbar-hide text-sm font-mono">
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-2 ${log.includes('CRITICAL') ? 'text-red-400' : 'text-gray-300'}`}>
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => fetch('http://localhost:8000/reset?task_id=1', { method: 'POST' })}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded-lg text-[10px] font-bold text-blue-300 uppercase tracking-widest transition-all"
          >
            Load Easy
          </button>
          <button
            onClick={() => fetch('http://localhost:8000/reset?task_id=2', { method: 'POST' })}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/30 rounded-lg text-[10px] font-bold text-yellow-300 uppercase tracking-widest transition-all"
          >
            Load Medium
          </button>
          <button
            onClick={() => fetch('http://localhost:8000/reset?task_id=3', { method: 'POST' })}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-lg text-[10px] font-bold text-red-300 uppercase tracking-widest transition-all"
          >
            Load Hard
          </button>
        </div>
        
        <div className="flex gap-4">
          {data.services.map(s => (
            <div key={s.name} className="flex gap-2">
              <button
                onClick={async () => {
                  await fetch('http://localhost:8000/step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'restart_service', target: s.name })
                  })
                }}
                className="px-4 py-2 bg-white/5 hover:bg-green-500/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-all"
              >
                Restart {s.name}
              </button>
              <button
                onClick={async () => {
                  await fetch('http://localhost:8000/step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'kill_process', target: s.name })
                  })
                }}
                className="px-4 py-2 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-all text-red-400"
              >
                Kill
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
