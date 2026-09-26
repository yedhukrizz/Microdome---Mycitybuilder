import React, { useRef, useEffect, useState } from 'react';
import { Play, Download, Upload, Sparkles, Map, Volume2, VolumeX, Shield, Zap, Building2, ChevronRight } from 'lucide-react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';
import { soundEngine } from '../audio/soundEngine';
import { CityManager } from '../engine/cityGrid';

interface HomeScreenProps {
  onStartNewGame: (preset: 'starter' | 'busy' | 'delta') => void;
  onLoadGame: () => void;
  onImportGameJson: (jsonString: string) => void;
  hasSavedGame: boolean;
  savedGameSummary?: { population: number; treasury: number; date: string } | null;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartNewGame,
  onLoadGame,
  onImportGameJson,
  hasSavedGame,
  savedGameSummary,
  isMuted,
  onToggleMute,
}) => {
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<'starter' | 'busy' | 'delta' | 'save'>('starter');

  // Mini 3D Preview Three.js effect
  useEffect(() => {
    const container = previewCanvasRef.current;
    if (!container) return;

    container.innerHTML = '';
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xe2e8f0 : 0x0a0a0c);
    scene.fog = new THREE.FogExp2(isLight ? 0xe2e8f0 : 0x0a0a0c, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(30, 28, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Build mini city model based on selectedPreset
    const previewCity = new CityManager(selectedPreset === 'save' ? 'starter' : selectedPreset);
    if (selectedPreset === 'save' && hasSavedGame) {
      try {
        const raw = localStorage.getItem('skyline_architect_save');
        if (raw) {
          const data = JSON.parse(raw);
          previewCity.importData(data);
        }
      } catch {}
    }

    // Render mini grid
    const group = new THREE.Group();
    const size = 18;
    const offset = size / 2;

    const groundGeo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
    const grassMat = new THREE.MeshLambertMaterial({ color: isLight ? 0x86efac : 0x166534 });
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const bldgMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const gx = x - offset;
        const gz = z - offset;
        const cell = previewCity.grid[x]?.[z];

        let mat = grassMat;
        let h = 0.2;

        if (cell?.road) {
          mat = roadMat;
        } else if (cell?.zone) {
          mat = bldgMat;
          h = 0.6 + (x + z) % 3 * 0.4;
        }

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, h, 0.92), mat);
        mesh.position.set(gx, h / 2, gz);
        group.add(mesh);
      }
    }

    scene.add(group);

    // Animation loop for rotation
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [selectedPreset, hasSavedGame, isLight]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportGameJson(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-y-auto min-h-screen ${
      isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-950 text-white'
    }`}>
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col space-y-6 my-auto py-4">
        {/* Top Header */}
        <div className="w-full flex justify-between items-center px-2">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs tracking-wider uppercase font-bold text-emerald-500">Urbanite 3D Game Launcher</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTheme(isLight ? 'black' : 'light')}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                isLight ? 'bg-white border-neutral-300 text-neutral-800' : 'bg-neutral-900 border-neutral-700 text-white'
              }`}
            >
              {isLight ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLight ? 'bg-white border-neutral-300 text-neutral-800' : 'bg-neutral-900 border-neutral-700 text-white'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>
          </div>
        </div>

        {/* Two-Pane Game Launcher Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
          {/* Left Pane (Span 6): Menu, Resume, & Map Presets */}
          <div className={`lg:col-span-6 p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-6 shadow-2xl ${
            isLight ? 'bg-white/95 border-neutral-200' : 'bg-neutral-900/90 border-neutral-800'
          }`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Isometric City Simulation</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                Urbanite 3D
              </h1>
              <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Select a scenario or continue your saved city. Inspect the live 3D preview on the right before launching.
              </p>
            </div>

            {/* Selection Options */}
            <div className="space-y-3">
              {/* Resume Save */}
              <button
                type="button"
                disabled={!hasSavedGame}
                onClick={() => {
                  soundEngine.playSelect();
                  onLoadGame();
                }}
                onMouseEnter={() => hasSavedGame && setSelectedPreset('save')}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedPreset === 'save'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                    : isLight ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-900'
                } ${!hasSavedGame && 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Play className="w-5 h-5 fill-current" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Resume Saved City</h3>
                    <p className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      {hasSavedGame && savedGameSummary
                        ? `Pop: ${savedGameSummary.population.toLocaleString()} | Treasury: $${savedGameSummary.treasury.toLocaleString()}`
                        : 'No active local save found'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>

              {/* Preset 1: Greenfield */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  setSelectedPreset('starter');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedPreset === 'starter'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/10'
                    : isLight ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Map className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">Greenfield River Delta</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Beginner</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Gentle river delta with starter highway access ($75k funds)
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>

              {/* Preset 2: Bustling City */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  setSelectedPreset('busy');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedPreset === 'busy'
                    ? 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-500/10'
                    : isLight ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <span className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">Bustling Urban Core</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">Active Traffic</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Pre-built skyscrapers and commuting vehicles
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>

              {/* Preset 3: Delta Bay */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  setSelectedPreset('delta');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedPreset === 'delta'
                    ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/10'
                    : isLight ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <span className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">Delta Bridge Bay</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">Scenic Bay</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Water channel bay with multiple crossing potentials
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Action Launch Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  if (selectedPreset === 'save') {
                    onLoadGame();
                  } else {
                    onStartNewGame(selectedPreset);
                  }
                }}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch City</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSelect();
                  fileInputRef.current?.click();
                }}
                className={`py-3 px-4 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  isLight ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300' : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>

          {/* Right Pane (Span 6): Live 3D Game Lobby Preview */}
          <div className={`lg:col-span-6 p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 shadow-2xl relative overflow-hidden ${
            isLight ? 'bg-white/95 border-neutral-200' : 'bg-neutral-900/90 border-neutral-800'
          }`}>
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Live 3D Preview Lobby</h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {selectedPreset === 'save' ? 'Saved City' : `${selectedPreset.toUpperCase()} Scenario`}
              </span>
            </div>

            {/* Mini Three.js Canvas Container */}
            <div
              ref={previewCanvasRef}
              className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden relative flex items-center justify-center cursor-grab active:cursor-grabbing border border-neutral-800/40 bg-black/20 shadow-inner"
            />

            <div className={`text-center text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Interactive 3D preview rotating live • Click <strong className="text-emerald-500">Launch City</strong> to start playing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
