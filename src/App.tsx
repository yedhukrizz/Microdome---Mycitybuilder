import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CityManager } from './engine/cityGrid';
import { ThreeSceneManager } from './engine/threeScene';
import { soundEngine } from './audio/soundEngine';
import { TopBar } from './components/TopBar';
import { BottomToolbar } from './components/BottomToolbar';
import { DemandMeter } from './components/DemandMeter';
import { ChirperFeed } from './components/ChirperFeed';
import { InspectorModal } from './components/InspectorModal';
import { EconomyModal } from './components/EconomyModal';
import { MilestonesModal } from './components/MilestonesModal';
import { PresetsModal } from './components/PresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { CityOverviewModal } from './components/CityOverviewModal';
import { CityGraphsModal } from './components/CityGraphsModal';
import { OverlayLegend } from './components/OverlayLegend';
import { MilestoneCelebration } from './components/MilestoneCelebration';
import { TouchControls } from './components/TouchControls';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { HomeScreen } from './components/HomeScreen';
import {
  ActiveTool,
  CellData,
  ChirpMessage,
  CityBudget,
  CityDemands,
  CityStats,
  Milestone,
  OverlayMode,
} from './types/city';

function MainGame() {
  const { theme, undistractedMode, toggleUndistractedMode, contactShadows, graphicsQuality } = useTheme();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cityManagerRef = useRef<CityManager | null>(null);
  const threeSceneRef = useRef<ThreeSceneManager | null>(null);

  // React state synced with simulation
  const [stats, setStats] = useState<CityStats>({
    population: 0,
    jobs: 0,
    employed: 0,
    unemploymentRate: 0,
    cityHappiness: 75,
    powerProduction: 0,
    powerConsumption: 0,
    waterProduction: 0,
    waterConsumption: 0,
    dayTime: 10.0,
    simulationSpeed: 1,
    week: 1,
    year: 2026,
    totalCarsOnRoad: 0,
    highwayCommuters: 0,
    trafficCongestionRate: 0,
    educationLevel: 45,
    uneducatedRate: 35,
    highSchoolRate: 50,
    universityRate: 15,
    schoolCapacity: 350,
    studentsEnrolled: 0,
    averageIncome: 580,
    totalWagesPaid: 0,
    povertyRate: 8,
    commercialTurnover: 0,
    housingCapacity: 32,
    housingOccupancy: 100,
    commercialCapacity: 20,
    commercialEmployees: 16,
    commercialShoppers: 12,
    industrialCapacity: 20,
    industrialEmployees: 16,
    officeCapacity: 10,
    officeEmployees: 8,
    netMigration: 0,
    citizenInflow: 0,
    citizenOutflow: 0,
    abandonedBuildings: 0,
    unpoweredBuildings: 0,
    unwateredBuildings: 0,
    needsPower: 100,
    needsWater: 100,
    needsHealth: 50,
    needsEducation: 50,
    needsSafety: 50,
    needsJobs: 100,
    needsTaxSatisfaction: 100,
    needsEnvironment: 100,
  });

  const [budget, setBudget] = useState<CityBudget>({
    treasury: 65000,
    incomePerWeek: 0,
    expensesPerWeek: 0,
    taxRateResidential: 10,
    taxRateCommercial: 10,
    taxRateIndustrial: 10,
    taxRateOffice: 10,
  });

  const [demands, setDemands] = useState<CityDemands>({
    residential: 60,
    commercial: 35,
    industrial: 45,
    office: 30,
    education: 40,
    fire: 25,
    health: 30,
    entertainment: 35,
    parks: 30,
  });

  const [activeTool, setActiveTool] = useState<ActiveTool>({ category: 'zones', zoneType: 'residential' });
  const [isBuildMode, setIsBuildMode] = useState<boolean>(true);
  const [selectedCoord, setSelectedCoord] = useState<{ x: number; z: number } | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [inspectedCell, setInspectedCell] = useState<CellData | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  
  const [viewMode, setViewMode] = useState<'home' | 'game'>('home');
  const [threeSceneCrashed, setThreeSceneCrashed] = useState<boolean>(false);
  const pendingActionRef = useRef<'load' | 'starter' | 'busy' | 'delta' | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('skyline_architect_save');
    } catch {
      return false;
    }
  });
  const [savedGameSummary, setSavedGameSummary] = useState<{ population: number; treasury: number; date: string } | null>(() => {
    try {
      const raw = localStorage.getItem('skyline_architect_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          population: parsed.stats?.population || 0,
          treasury: parsed.budget?.treasury || 75000,
          date: new Date().toLocaleDateString(),
        };
      }
    } catch {}
    return null;
  });

  // Dedicated Road Corridor Route Builder states
  const [roadCorridorMode, setRoadCorridorMode] = useState<boolean>(false);
  const [roadCorridorStart, setRoadCorridorStart] = useState<{ x: number; z: number } | null>(null);

  // Two Building Placement Modes: 'confirm' (safe click + checkbox to build, scrolling doesn't build) vs 'rapid' (instant)
  const [buildPlacementMode, setBuildPlacementMode] = useState<'confirm' | 'rapid'>('confirm');

  // Synchronized refs to completely eliminate stale closures in Three.js event callbacks
  const activeToolRef = useRef<ActiveTool>(activeTool);
  activeToolRef.current = activeTool;

  const isBuildModeRef = useRef<boolean>(isBuildMode);
  isBuildModeRef.current = isBuildMode;

  const buildPlacementModeRef = useRef<'confirm' | 'rapid'>('confirm');
  buildPlacementModeRef.current = buildPlacementMode;

  const roadCorridorModeRef = useRef<boolean>(roadCorridorMode);
  roadCorridorModeRef.current = roadCorridorMode;

  const roadCorridorStartRef = useRef<{ x: number; z: number } | null>(roadCorridorStart);
  roadCorridorStartRef.current = roadCorridorStart;

  // Chirper messages list
  const [chirps, setChirps] = useState<ChirpMessage[]>([
    {
      id: 'c1',
      author: 'City Council',
      handle: '@SkylineGov',
      avatarEmoji: '🏛️',
      text: 'Highway connection established with regional network! Citizens and trade vehicles can now commute freely.',
      type: 'news',
      timestamp: 'Just now',
    },
  ]);

  // Check saved game presence on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skyline_architect_save');
      if (saved) setHasSavedGame(true);
    } catch {
      // ignore
    }
  }, []);

  // Initialize Three.js scene and CityManager when in game view
  useEffect(() => {
    if (viewMode !== 'game' || !canvasContainerRef.current) return;

    if (!cityManagerRef.current) {
      cityManagerRef.current = new CityManager('starter');
    }
    const city = cityManagerRef.current;

    const scene = new ThreeSceneManager(canvasContainerRef.current, city);
    threeSceneRef.current = scene;
    scene.setContactShadows(contactShadows);
    scene.setGraphicsQuality(graphicsQuality);
    scene.onCrash = () => {
      setThreeSceneCrashed(true);
    };

    if (pendingActionRef.current === 'load') {
      try {
        const raw = localStorage.getItem('skyline_architect_save');
        if (raw) {
          const data = JSON.parse(raw);
          city.importData(data);
          city.recalculateRoadConnections();
          city.recomputeNetworksAndSimulation(true);
          scene.buildTerrain();
          scene.buildFoliage();
          scene.rebuildCityScene();
        }
      } catch (e) {
        console.error('Pending load failed', e);
      }
      pendingActionRef.current = null;
    } else if (pendingActionRef.current) {
      const preset = pendingActionRef.current as 'starter' | 'busy' | 'delta';
      city.initMap(preset);
      scene.buildTerrain();
      scene.buildFoliage();
      scene.rebuildCityScene();
      pendingActionRef.current = null;
    } else {
      scene.rebuildCityScene();
    }

    setStats({ ...city.stats });
    setBudget({ ...city.budget });
    setDemands({ ...city.demands });

    city.onMilestoneAchieved = (m: Milestone) => {
      soundEngine.playMilestone();
      setCelebratingMilestone(m);
    };

    city.onChirpTrigger = (type, text) => {
      const newChirp: ChirpMessage = {
        id: `chirp_${Date.now()}_${Math.random()}`,
        author: type === 'warning' ? 'Alert Bot' : type === 'concern' ? 'Commuter News' : 'Citizen Voice',
        handle: '@citizen',
        avatarEmoji: type === 'warning' ? '🚨' : type === 'concern' ? '🚗' : '😊',
        text,
        type,
        timestamp: 'Just now',
      };
      setChirps((prev) => [newChirp, ...prev.slice(0, 15)]);
    };

    // Handle clicks or touch taps on 3D grid
    scene.onCellClicked = (x: number, z: number) => {
      handleTileAction(x, z);
    };

    // Simulation tick loop with throttled React state sync
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      city.update(delta);

      setStats({ ...city.stats });
      setBudget({ ...city.budget });
      setDemands({ ...city.demands });

      if (inspectedCell) {
        const fresh = city.getCell(inspectedCell.x, inspectedCell.z);
        if (fresh) setInspectedCell({ ...fresh });
      }
    }, 250);

    return () => {
      clearInterval(interval);
      scene.dispose();
    };
  }, [viewMode]);

  // Sync contact shadows & graphics quality
  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.setContactShadows(contactShadows);
    }
  }, [contactShadows]);

  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.setGraphicsQuality(graphicsQuality);
    }
  }, [graphicsQuality]);

  // Sync build mode to ThreeSceneManager
  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.buildModeActive = isBuildMode;
    }
  }, [isBuildMode]);

  // Sync placement mode (confirm vs rapid) to ThreeSceneManager
  useEffect(() => {
    if (threeSceneRef.current) {
      threeSceneRef.current.placementMode = buildPlacementMode;
    }
  }, [buildPlacementMode]);

  // Update cursor hover color based on tool
  useEffect(() => {
    if (!threeSceneRef.current) return;
    if (activeTool.category === 'bulldoze') {
      threeSceneRef.current.setHoverColor(0xef4444);
    } else if (activeTool.category === 'inspect' || !isBuildMode) {
      threeSceneRef.current.setHoverColor(0x38bdf8);
    } else if (activeTool.category === 'roads') {
      threeSceneRef.current.setHoverColor(0x10b981);
    } else if (activeTool.category === 'zones' || activeTool.category === 'buildings') {
      threeSceneRef.current.setHoverColor(0x3b82f6);
    } else {
      threeSceneRef.current.setHoverColor(0xf59e0b);
    }
  }, [activeTool, isBuildMode]);

  // Update overlay in ThreeScene
  useEffect(() => {
    if (!cityManagerRef.current || !threeSceneRef.current) return;
    cityManagerRef.current.overlayMode = overlayMode;
    threeSceneRef.current.rebuildCityScene();
  }, [overlayMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Immediate Build Execution helper
  const executeBuildAt = (x: number, z: number) => {
    const city = cityManagerRef.current;
    const scene = threeSceneRef.current;
    if (!city || !scene) return;

    const currentTool = activeToolRef.current;
    const res = city.applyTool(x, z, currentTool);
    if (!res.success) {
      soundEngine.playAlert();
      if (res.message) showToast(res.message);
      return;
    }

    let actionDesc = 'Built';
    if (currentTool.category === 'roads') {
      soundEngine.playBuildRoad();
      actionDesc = `Placed ${currentTool.roadType.replace(/_/g, ' ').toUpperCase()}`;
    } else if (currentTool.category === 'zones') {
      soundEngine.playZone();
      actionDesc = `Zoned ${currentTool.zoneType.toUpperCase()}`;
    } else if (currentTool.category === 'buildings') {
      soundEngine.playZone();
      actionDesc = `Built ${currentTool.buildingType.replace(/_/g, ' ').toUpperCase()}`;
    } else if (currentTool.category === 'bulldoze') {
      soundEngine.playBulldoze();
      actionDesc = 'Demolished';
    } else if (currentTool.category === 'utilities') {
      soundEngine.playUpgrade();
      actionDesc = `Built ${currentTool.serviceType.replace(/_/g, ' ').toUpperCase()}`;
    } else {
      soundEngine.playUpgrade();
      actionDesc = 'Built Service';
    }

    showToast(`✓ ${actionDesc} at [${x}, ${z}]`);

    scene.rebuildCityScene();
    scene.selectTile(x, z);

    if (inspectedCell && inspectedCell.x === x && inspectedCell.z === z) {
      const cell = city.getCell(x, z);
      if (cell) setInspectedCell({ ...cell });
    }
  };

  const handleTileAction = (x: number, z: number) => {
    const city = cityManagerRef.current;
    const scene = threeSceneRef.current;
    if (!city || !scene) return;

    const currentTool = activeToolRef.current;
    const currentBuildMode = isBuildModeRef.current;
    const currentPlacementMode = buildPlacementModeRef.current;

    setSelectedCoord({ x, z });
    scene.selectTile(x, z);

    // Pan / Inspect mode
    if (!currentBuildMode || currentTool.category === 'inspect') {
      const cell = city.getCell(x, z);
      if (cell) {
        soundEngine.playSelect();
        setInspectedCell({ ...cell });
      }
      return;
    }

    // Dedicated Road Corridor Route Builder Mode
    if (currentTool.category === 'roads' && roadCorridorModeRef.current) {
      if (!roadCorridorStartRef.current) {
        setRoadCorridorStart({ x, z });
        soundEngine.playSelect();
        showToast(`📍 Start set at [${x}, ${z}]. Now tap destination tile!`);
        return;
      } else {
        const start = roadCorridorStartRef.current;
        const roadType = currentTool.roadType || 'two_lane';
        const res = city.buildRoadRoute(start.x, start.z, x, z, roadType);
        if (!res.success) {
          soundEngine.playAlert();
          showToast(res.message || 'Cannot build road corridor!');
        } else {
          soundEngine.playBuildRoad();
          showToast(`✓ Built corridor of ${res.count} road tiles ($${res.cost})!`);
          scene.rebuildCityScene();
          scene.selectTile(x, z);
        }
        setRoadCorridorStart(null);
        return;
      }
    }

    // In Confirm Mode (Safe): Clicking a tile selects it and inspects it.
    if (currentPlacementMode === 'confirm') {
      const cell = city.getCell(x, z);
      if (cell) {
        soundEngine.playSelect();
        setInspectedCell({ ...cell });
      }
      return;
    }

    // In Rapid Place Mode: immediately build!
    executeBuildAt(x, z);
  };

  const handleBuildOnSelected = () => {
    if (selectedCoord) {
      executeBuildAt(selectedCoord.x, selectedCoord.z);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!cityManagerRef.current) return;
    cityManagerRef.current.stats.simulationSpeed = speed;
    setStats((prev) => ({ ...prev, simulationSpeed: speed }));
    soundEngine.playSelect();
  };

  const handleResetCamera = () => {
    threeSceneRef.current?.resetCamera();
    soundEngine.playSelect();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEngine.setMuted(newMuted);
  };

  const handleToggleDayNight = () => {
    if (!cityManagerRef.current) return;
    const cur = cityManagerRef.current.stats.dayTime;
    cityManagerRef.current.stats.dayTime = (cur + 12) % 24;
    soundEngine.playSelect();
  };

  const handleUpdateTaxRate = (
    zone: 'residential' | 'commercial' | 'industrial' | 'office',
    rate: number
  ) => {
    if (!cityManagerRef.current) return;
    if (zone === 'residential') cityManagerRef.current.budget.taxRateResidential = rate;
    else if (zone === 'commercial') cityManagerRef.current.budget.taxRateCommercial = rate;
    else if (zone === 'industrial') cityManagerRef.current.budget.taxRateIndustrial = rate;
    else if (zone === 'office') cityManagerRef.current.budget.taxRateOffice = rate;

    setBudget({ ...cityManagerRef.current.budget });
  };

  const handleTakeBond = (amount: number) => {
    if (!cityManagerRef.current) return;
    cityManagerRef.current.budget.treasury += amount;
    cityManagerRef.current.budget.expensesPerWeek += Math.round(amount * 0.015);
    setBudget({ ...cityManagerRef.current.budget });
    soundEngine.playCoin();
    showToast(`Bond of $${amount.toLocaleString()} received!`);
  };

  const handleExpandMap = (direction: 'south' | 'east' | 'west') => {
    const city = cityManagerRef.current;
    if (!city) return;
    if (city.budget.treasury < 40000) {
      showToast('Insufficient funds for map expansion ($40,000 required)');
      return;
    }
    city.budget.treasury -= 40000;
    city.budget.expensesPerWeek += 200;
    city.expandMap(direction);
    if (threeSceneRef.current) {
      threeSceneRef.current.buildTerrain();
      threeSceneRef.current.buildFoliage();
      threeSceneRef.current.rebuildCityScene();
    }
    setBudget({ ...city.budget });
    soundEngine.playCoin();
    showToast(`City map boundaries successfully expanded to the ${direction} by +12 tiles!`);
  };

  const handleStartNewGame = (preset: 'starter' | 'busy' | 'delta') => {
    pendingActionRef.current = preset;
    setViewMode('game');
    setActiveModal(null);
    const city = cityManagerRef.current;
    const scene = threeSceneRef.current;
    if (city && scene) {
      city.initMap(preset);
      scene.buildTerrain();
      scene.buildFoliage();
      scene.rebuildCityScene();
      setStats({ ...city.stats });
      setBudget({ ...city.budget });
      setDemands({ ...city.demands });
      setInspectedCell(null);
      soundEngine.playMilestone();
      showToast(`Loaded ${preset.toUpperCase()} scenario!`);
    }
  };

  const handleSaveGame = () => {
    const city = cityManagerRef.current;
    if (!city) return;

    try {
      const saveData = {
        grid: city.grid,
        budget: city.budget,
        stats: city.stats,
        demands: city.demands,
        milestones: city.milestones,
        highwayPortalCoord: city.highwayPortalCoord,
      };
      localStorage.setItem('skyline_architect_save', JSON.stringify(saveData));
      setHasSavedGame(true);
      setSavedGameSummary({
        population: city.stats.population,
        treasury: city.budget.treasury,
        date: new Date().toLocaleDateString(),
      });
      soundEngine.playCoin();
      showToast('City saved successfully!');
    } catch {
      showToast('Error saving city to local storage.');
    }
  };

  const handleLoadGame = () => {
    pendingActionRef.current = 'load';
    setViewMode('game');
    setActiveModal(null);
    const city = cityManagerRef.current;
    const scene = threeSceneRef.current;
    if (city && scene) {
      try {
        const raw = localStorage.getItem('skyline_architect_save');
        if (!raw) {
          showToast('No saved game found.');
          return;
        }
        const data = JSON.parse(raw);
        city.importData(data);
        city.recalculateRoadConnections();
        city.recomputeNetworksAndSimulation(true);
        scene.buildTerrain();
        scene.buildFoliage();
        scene.rebuildCityScene();
        setStats({ ...city.stats });
        setBudget({ ...city.budget });
        setDemands({ ...city.demands });
        setInspectedCell(null);
        soundEngine.playMilestone();
        showToast('Saved city loaded successfully!');
      } catch {
        showToast('Failed to load saved game.');
      }
    }
  };

  const handleDownloadJson = () => {
    const city = cityManagerRef.current;
    if (!city) return;
    try {
      const saveData = {
        grid: city.grid,
        budget: city.budget,
        stats: city.stats,
        demands: city.demands,
        milestones: city.milestones,
        highwayPortalCoord: city.highwayPortalCoord,
      };
      const jsonStr = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urbanite_city_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('City JSON downloaded!');
      soundEngine.playCoin();
    } catch {
      showToast('Failed to download city JSON.');
    }
  };

  const handleImportGameJson = (jsonString: string) => {
    const city = cityManagerRef.current;
    const scene = threeSceneRef.current;
    if (!city || !scene) return;

    try {
      const data = JSON.parse(jsonString);
      city.grid = data.grid;
      city.budget = data.budget;
      city.stats = data.stats;
      city.demands = data.demands;
      city.milestones = data.milestones;
      if (data.highwayPortalCoord) city.highwayPortalCoord = data.highwayPortalCoord;

      city.recalculateRoadConnections();
      city.recomputeNetworksAndSimulation(true);

      scene.buildTerrain();
      scene.buildFoliage();
      scene.rebuildCityScene();

      setStats({ ...city.stats });
      setBudget({ ...city.budget });
      setDemands({ ...city.demands });
      setInspectedCell(null);
      setViewMode('game');
      setActiveModal(null);
      soundEngine.playMilestone();
      showToast('City imported successfully!');
    } catch {
      showToast('Invalid city JSON save file.');
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const scene = threeSceneRef.current;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          scene?.panCamera(0, -1.2);
          break;
        case 's':
        case 'arrowdown':
          if (!e.ctrlKey && !e.metaKey) scene?.panCamera(0, 1.2);
          break;
        case 'a':
        case 'arrowleft':
          scene?.panCamera(-1.2, 0);
          break;
        case 'd':
        case 'arrowright':
          scene?.panCamera(1.2, 0);
          break;
        case 'q':
          scene?.rotateCamera(-0.1);
          break;
        case 'e':
          scene?.rotateCamera(0.1);
          break;
        case 'i':
          setActiveTool({ category: 'inspect' });
          soundEngine.playSelect();
          break;
        case 'r':
          setActiveTool({ category: 'roads', roadType: 'two_lane' });
          soundEngine.playSelect();
          break;
        case 'z':
          setActiveTool({ category: 'zones', zoneType: 'residential' });
          soundEngine.playSelect();
          break;
        case 'b':
          setActiveTool({ category: 'bulldoze' });
          soundEngine.playSelect();
          break;
        case 'u':
        case 'h':
          toggleUndistractedMode();
          break;
        case ' ':
          e.preventDefault();
          handleSpeedChange(stats.simulationSpeed === 0 ? 1 : 0);
          break;
        case 'escape':
          setActiveModal(null);
          setInspectedCell(null);
          setOverlayMode('none');
          setActiveTool({ category: 'inspect' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stats.simulationSpeed, toggleUndistractedMode]);

  // Auto-save interval in game mode
  useEffect(() => {
    if (viewMode === 'game') {
      const autoSaveInterval = setInterval(() => {
        if (cityManagerRef.current) {
          const saveData = {
            grid: cityManagerRef.current.grid,
            budget: cityManagerRef.current.budget,
            stats: cityManagerRef.current.stats,
            demands: cityManagerRef.current.demands,
            milestones: cityManagerRef.current.milestones,
            highwayPortalCoord: cityManagerRef.current.highwayPortalCoord,
          };
          localStorage.setItem('skyline_architect_save', JSON.stringify(saveData));
          setHasSavedGame(true);
        }
      }, 45000);
      return () => clearInterval(autoSaveInterval);
    }
  }, [viewMode]);

  const isLight = theme === 'light';

  if (viewMode === 'home') {
    return (
      <HomeScreen
        onStartNewGame={handleStartNewGame}
        onLoadGame={handleLoadGame}
        onImportGameJson={handleImportGameJson}
        hasSavedGame={hasSavedGame}
        savedGameSummary={savedGameSummary}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden font-sans select-none touch-none transition-colors ${
        isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-black text-white'
      }`}
    >
      {/* 3D Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair touch-none"
      />

      {/* Top Bar Contract (Wordmark, Nav, Stats, Actions) */}
      <TopBar
        stats={stats}
        budget={budget}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        onSpeedChange={handleSpeedChange}
        onResetCamera={handleResetCamera}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleDayNight={handleToggleDayNight}
      />

      {/* R-C-I & Municipal Utilities Overlay Meters (Click for Analytics / Overview) */}
      <div className="absolute top-11 left-2 sm:left-3 z-20">
        <DemandMeter
          demands={demands}
          stats={stats}
          onOpenGraphs={() => setActiveModal('graphs')}
          onOpenOverview={() => setActiveModal('overview')}
        />
      </div>

      {/* Chirper Live Citizen Feed */}
      <ChirperFeed chirps={chirps} />

      {/* On-screen Touch Controls (Zoom, Rotate, Pan Directional Cluster) */}
      <TouchControls
        onZoomIn={() => threeSceneRef.current?.zoomCamera(-4)}
        onZoomOut={() => threeSceneRef.current?.zoomCamera(4)}
        onRotateLeft={() => threeSceneRef.current?.rotateCamera(-0.2)}
        onRotateRight={() => threeSceneRef.current?.rotateCamera(0.2)}
        onResetView={handleResetCamera}
        onZoomOverview={() => threeSceneRef.current?.zoomOverview()}
        onPanDirection={(dir) => threeSceneRef.current?.panCameraDirection(dir)}
      />

      {/* Overlay legend if active */}
      <OverlayLegend mode={overlayMode} onClose={() => setOverlayMode('none')} />

      {/* Bottom Main Tool Dock with Build Mode, Road Sub-tools & Corridor Routing */}
      <BottomToolbar
        activeTool={activeTool}
        setActiveTool={(tool) => {
          setActiveTool(tool);
          if (tool.category !== 'inspect') {
            setInspectedCell(null);
          }
        }}
        overlayMode={overlayMode}
        setOverlayMode={setOverlayMode}
        isBuildMode={isBuildMode}
        setIsBuildMode={setIsBuildMode}
        onToggleBuildMode={() => {
          const next = !isBuildMode;
          setIsBuildMode(next);
          soundEngine.playSelect();
          showToast(next ? '🔨 BUILD MODE ACTIVE: Tap map to build!' : '🖐️ PAN MODE ACTIVE: Drag to move camera');
        }}
        selectedCoord={selectedCoord}
        onBuildOnSelected={handleBuildOnSelected}
        placementMode={buildPlacementMode}
        setPlacementMode={setBuildPlacementMode}
        roadCorridorMode={roadCorridorMode}
        onToggleRoadCorridorMode={() => {
          const next = !roadCorridorMode;
          setRoadCorridorMode(next);
          setRoadCorridorStart(null);
          soundEngine.playSelect();
          showToast(next ? '📐 Route Mode: Tap Start tile, then Destination tile' : '✏️ Freehand Painting Mode');
        }}
        roadCorridorStart={roadCorridorStart}
        onCancelCorridor={() => setRoadCorridorStart(null)}
      />

      {/* Inspector Card Modal */}
      {inspectedCell && (
        <InspectorModal
          cell={inspectedCell}
          onClose={() => setInspectedCell(null)}
          onBulldoze={(x, z) => {
            handleTileAction(x, z);
            setInspectedCell(null);
          }}
        />
      )}

      {/* Navigation Modals */}
      {activeModal === 'overview' && (
        <CityOverviewModal
          stats={stats}
          demands={demands}
          budget={budget}
          history={cityManagerRef.current?.history || []}
          onClose={() => setActiveModal(null)}
          onNavigate={(m) => setActiveModal(m)}
        />
      )}

      {activeModal === 'economy' && (
        <EconomyModal
          budget={budget}
          stats={stats}
          onUpdateTaxRate={handleUpdateTaxRate}
          onTakeBond={handleTakeBond}
          onExpandMap={handleExpandMap}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'milestones' && cityManagerRef.current && (
        <MilestonesModal
          milestones={cityManagerRef.current.milestones}
          currentPopulation={stats.population}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'graphs' && (
        <CityGraphsModal
          stats={stats}
          demands={demands}
          budget={budget}
          history={cityManagerRef.current?.history || []}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'presets' && (
        <PresetsModal
          onSelectPreset={handleStartNewGame}
          onSaveGame={handleSaveGame}
          onLoadGame={handleLoadGame}
          hasSavedGame={hasSavedGame}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          onSelectPreset={handleStartNewGame}
          onSaveGame={handleSaveGame}
          onLoadGame={handleLoadGame}
          onDownloadJson={handleDownloadJson}
          onReturnHome={() => {
            handleSaveGame();
            setViewMode('home');
            setActiveModal(null);
          }}
          hasSavedGame={hasSavedGame}
          onClose={() => setActiveModal(null)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onToggleDayNight={handleToggleDayNight}
          dayTime={stats.dayTime}
        />
      )}

      {/* Milestone celebration screen */}
      {celebratingMilestone && (
        <MilestoneCelebration
          milestone={celebratingMilestone}
          onDismiss={() => setCelebratingMilestone(null)}
        />
      )}

      {/* 3D Render Crash / Whiteout Recovery Modal */}
      {threeSceneCrashed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl text-white">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">3D Graphics Context Interrupted</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Your browser GPU or WebGL context was paused. Click below to instantly reload the 3D renderer without losing any of your city building progress or save data!
            </p>
            <button
              type="button"
              onClick={() => {
                setThreeSceneCrashed(false);
                if (threeSceneRef.current) {
                  threeSceneRef.current.dispose();
                  threeSceneRef.current = null;
                }
                if (canvasContainerRef.current && cityManagerRef.current) {
                  const scene = new ThreeSceneManager(canvasContainerRef.current, cityManagerRef.current);
                  threeSceneRef.current = scene;
                  scene.setContactShadows(contactShadows);
                  scene.setGraphicsQuality(graphicsQuality);
                  scene.onCrash = () => setThreeSceneCrashed(true);
                  scene.rebuildCityScene();
                }
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg"
            >
              Reload 3D Renderer (Keep Progress)
            </button>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toastMessage && (
        <div
          className={`absolute top-11 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-lg shadow-xl text-[11px] font-semibold animate-in fade-in slide-in-from-top-1 duration-150 whitespace-nowrap border ${
            isLight
              ? 'bg-white/95 border-neutral-300 text-neutral-900'
              : 'bg-black/95 border-neutral-700 text-white'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainGame />
    </ThemeProvider>
  );
}
