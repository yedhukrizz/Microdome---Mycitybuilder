import React, { useRef, useEffect, useState } from 'react';
import { Play, Download, Upload, Sparkles, Map, Volume2, VolumeX, Shield, Zap, Building2, ChevronRight, Layers, Globe } from 'lucide-react';
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
  const [mobileTab, setMobileTab] = useState<'menu' | 'preview'>('menu');

  // Mini 3D Preview Three.js effect
  useEffect(() => {
    const container = previewCanvasRef.current;
    if (!container) return;

    container.innerHTML = '';
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xe2e8f0 : 0x09090b);
    scene.fog = new THREE.FogExp2(isLight ? 0xe2e8f0 : 0x09090b, 0.012);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(34, 30, 34);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    dirLight.position.set(25, 45, 25);
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
    const size = 20;
    const offset = size / 2;

    const groundGeo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
    const grassMat = new THREE.MeshLambertMaterial({ color: isLight ? 0x86efac : 0x15803d });
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const bldgMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });

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
          h = 0.8 + (x + z) % 4 * 0.5;
        }

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, h, 0.92), mat);
        mesh.position.set(gx, h / 2, gz);
        group.add(mesh);
      }
    }

    scene.add(group);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.0025;
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
    <div className={`fixed inset-0 z-[100] flex flex-col select-none overflow-y-auto lg:overflow-hidden min-h-screen ${
      isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-950 text-white'
    }`}>
      {/* Background ambient glow for wide screens */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-sky-500/20 blur-3xl animate-pulse" />
      </div>

      {/* Top Header bar across all views */}
      <header className="relative z-20 w-full flex justify-between items-center px-4 sm:px-8 py-4 border-b border-neutral-800/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs tracking-wider uppercase font-bold text-emerald-500">Urbanite 3D Studio</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(isLight ? 'black' : 'light')}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
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
      </header>

      {/* =========================================================
          1. MOBILE VIEW LAYOUT (< md breakpoint)
          ========================================================= */}
      <div className="flex md:hidden flex-col flex-1 p-4 space-y-4 relative z-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Urbanite 3D</h1>
          <p className="text-xs text-neutral-400">Isometric City Builder & Simulation</p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex rounded-xl p-1 bg-neutral-900 border border-neutral-800">
          <button
            type="button"
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === 'menu' ? 'bg-emerald-600 text-white' : 'text-neutral-400'
            }`}
          >
            Game Menu
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mobileTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-neutral-400'
            }`}
          >
            3D City Preview
          </button>
        </div>

        {mobileTab === 'menu' ? (
          <div className="space-y-3 pb-6">
            <button
              type="button"
              disabled={!hasSavedGame}
              onClick={() => { soundEngine.playSelect(); onLoadGame(); }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between ${
                hasSavedGame ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-neutral-900 border-neutral-800 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-emerald-400 fill-current" />
                <div className="text-left">
                  <div className="font-bold text-sm">Resume City</div>
                  <div className="text-[10px] text-neutral-400">
                    {hasSavedGame && savedGameSummary ? `Pop: ${savedGameSummary.population}` : 'No save'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">New Game Presets</div>
              {(['starter', 'busy', 'delta'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { soundEngine.playSelect(); setSelectedPreset(preset); onStartNewGame(preset); }}
                  className="w-full p-3.5 rounded-2xl border bg-neutral-900 border-neutral-800 flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-bold text-sm capitalize">{preset === 'starter' ? 'Greenfield River' : preset === 'busy' ? 'Bustling Core' : 'Delta Bay'}</div>
                    <div className="text-[10px] text-neutral-400">36x36 grid • $75,000 funds</div>
                  </div>
                  <Play className="w-4 h-4 text-emerald-500 fill-current" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 pb-6">
            <div ref={previewCanvasRef} className="w-full h-80 rounded-2xl border border-neutral-800 bg-black/40 overflow-hidden" />
            <button
              type="button"
              onClick={() => { soundEngine.playSelect(); onStartNewGame(selectedPreset === 'save' ? 'starter' : selectedPreset); }}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg"
            >
              Launch Selected City
            </button>
          </div>
        )}
      </div>


      {/* =========================================================
          2. TABLET VIEW LAYOUT (md to lg breakpoint)
          ========================================================= */}
      <div className="hidden md:flex lg:hidden flex-col flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full justify-center relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Urbanite 3D Studio</h1>
          <p className="text-sm text-neutral-400">Tablet Launcher • Choose your scenario or resume progress</p>
        </div>

        <div className="grid grid-cols-2 gap-6 items-stretch">
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <button
                type="button"
                disabled={!hasSavedGame}
                onClick={() => { soundEngine.playSelect(); onLoadGame(); }}
                onMouseEnter={() => hasSavedGame && setSelectedPreset('save')}
                className={`w-full p-4 rounded-2xl border text-left ${
                  selectedPreset === 'save' ? 'border-emerald-500 bg-emerald-500/10' : 'bg-neutral-900 border-neutral-800'
                } ${!hasSavedGame && 'opacity-50'}`}
              >
                <div className="font-bold">Resume Saved City</div>
                <div className="text-xs text-neutral-400">{hasSavedGame ? 'Auto-save ready' : 'No save found'}</div>
              </button>

              {(['starter', 'busy', 'delta'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { soundEngine.playSelect(); setSelectedPreset(preset); }}
                  onMouseEnter={() => setSelectedPreset(preset)}
                  className={`w-full p-4 rounded-2xl border text-left ${
                    selectedPreset === preset ? 'border-emerald-500 bg-emerald-500/10' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="font-bold capitalize">{preset === 'starter' ? 'Greenfield River' : preset === 'busy' ? 'Bustling Core' : 'Delta Bay'}</div>
                  <div className="text-xs text-neutral-400">Interactive 3D preview active</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => { soundEngine.playSelect(); selectedPreset === 'save' ? onLoadGame() : onStartNewGame(selectedPreset); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch City</span>
            </button>
          </div>

          <div className="flex flex-col space-y-3">
            <div ref={previewCanvasRef} className="w-full h-80 rounded-2xl border border-neutral-800 bg-black/40 overflow-hidden shadow-2xl" />
            <div className="text-center text-xs text-neutral-400">Live 3D interactive scenario preview</div>
          </div>
        </div>
      </div>


      {/* =========================================================
          3. WIDE SCREEN / DESKTOP VIEW LAYOUT (lg and above breakpoint)
          ========================================================= */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden z-10 w-full">
        {/* Full Immersive 3D Background / Viewport on Wide Screen */}
        <div ref={previewCanvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-auto" />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent w-7/12 z-10" />

        {/* Floating Command Deck Sidebar on Wide Screen */}
        <div className="relative z-20 w-[32rem] h-full flex flex-col justify-between p-10 backdrop-blur-2xl bg-neutral-950/85 border-r border-neutral-800/80 shadow-2xl overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Desktop Studio Edition</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Urbanite 3D</h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Welcome back, Architect. Select your campaign scenario or resume your metropolis. The 3D preview updates live in the background.
              </p>
            </div>

            {/* Scenario / Save Selection List */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">Campaign & Saves</div>

              <button
                type="button"
                disabled={!hasSavedGame}
                onClick={() => { soundEngine.playSelect(); onLoadGame(); }}
                onMouseEnter={() => hasSavedGame && setSelectedPreset('save')}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedPreset === 'save'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                    : 'bg-neutral-900/90 border-neutral-800 hover:bg-neutral-900'
                } ${!hasSavedGame && 'opacity-40 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Play className="w-5 h-5 fill-current" />
                  </span>
                  <div>
                    <div className="font-bold text-sm">Resume City Save</div>
                    <div className="text-xs text-neutral-400">
                      {hasSavedGame && savedGameSummary ? `Pop: ${savedGameSummary.population.toLocaleString()} citizens` : 'No save file found'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {(['starter', 'busy', 'delta'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { soundEngine.playSelect(); setSelectedPreset(preset); }}
                  onMouseEnter={() => setSelectedPreset(preset)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedPreset === preset
                      ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                      : 'bg-neutral-900/90 border-neutral-800 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                      {preset === 'starter' ? <Map className="w-5 h-5" /> : preset === 'busy' ? <Building2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </span>
                    <div>
                      <div className="font-bold text-sm capitalize">
                        {preset === 'starter' ? 'Greenfield River Delta' : preset === 'busy' ? 'Bustling Urban Core' : 'Delta Bridge Bay'}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {preset === 'starter' ? 'Beginner friendly • River basin' : preset === 'busy' ? 'Active vehicle traffic & skyscrapers' : 'Scenic water bay & bridges'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Launch & Import Actions */}
          <div className="space-y-3 pt-6 border-t border-neutral-800/80">
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
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Desktop City</span>
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
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs rounded-2xl border border-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import City Save (.json)</span>
            </button>

            <div className="text-center text-[11px] text-neutral-400 pt-1">
              Persistent auto-saving • Real-time traffic simulation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
