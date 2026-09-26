import React, { useState } from 'react';
import {
  X,
  Zap,
  Droplets,
  Building2,
  Users,
  Briefcase,
  Smile,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  Trees,
  ShoppingBag,
  Factory,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  DollarSign,
  Activity,
  Home,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { CityBudget, CityDemands, CityHistorySnapshot, CityStats } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface CityOverviewModalProps {
  stats: CityStats;
  demands: CityDemands;
  budget: CityBudget;
  history?: CityHistorySnapshot[];
  onClose: () => void;
  onNavigate?: (modalId: string) => void;
}

export const CityOverviewModal: React.FC<CityOverviewModalProps> = ({
  stats,
  demands,
  budget,
  history = [],
  onClose,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeFilter, setActiveFilter] = useState<'all' | 'utilities' | 'capacities' | 'leaving' | 'needs'>('all');

  // Utility calculations
  const isPowerDeficit = stats.powerConsumption > stats.powerProduction;
  const isWaterDeficit = stats.waterConsumption > stats.waterProduction;
  const powerMargin = stats.powerProduction - stats.powerConsumption;
  const waterMargin = stats.waterProduction - stats.waterConsumption;
  const powerLoadPct = stats.powerProduction > 0 ? Math.round((stats.powerConsumption / stats.powerProduction) * 100) : (stats.powerConsumption > 0 ? 100 : 0);
  const waterLoadPct = stats.waterProduction > 0 ? Math.round((stats.waterConsumption / stats.waterProduction) * 100) : (stats.waterConsumption > 0 ? 100 : 0);

  // Sector capacity metrics
  const housingVacancies = Math.max(0, stats.housingCapacity - stats.population);
  const commercialVacancies = Math.max(0, stats.commercialCapacity - stats.commercialEmployees);
  const industrialVacancies = Math.max(0, stats.industrialCapacity - stats.industrialEmployees);
  const officeVacancies = Math.max(0, stats.officeCapacity - stats.officeEmployees);

  // Diagnostic Departure Factors (Why People Leave or Stay)
  const departureFactors = [
    {
      id: 'power',
      name: 'Electrical Grid Reliability',
      icon: Zap,
      status: isPowerDeficit || stats.unpoweredBuildings > 0 ? 'critical' : powerLoadPct > 85 ? 'warning' : 'optimal',
      metric: `${stats.unpoweredBuildings} dark buildings (${powerMargin >= 0 ? `+${powerMargin}` : powerMargin} MW)`,
      whyLeaving: isPowerDeficit || stats.unpoweredBuildings > 0
        ? 'Blackouts cause residential and commercial buildings to lose basic power. Citizens abandon unpowered homes after prolonged cuts.'
        : 'Electrical grid is stable and fully powering all buildings.',
      remedy: 'Construct Wind Turbines (+60 MW) or Solar Farms (+160 MW) connected along roads.',
    },
    {
      id: 'water',
      name: 'Potable Water Network',
      icon: Droplets,
      status: isWaterDeficit || stats.unwateredBuildings > 0 ? 'critical' : waterLoadPct > 85 ? 'warning' : 'optimal',
      metric: `${stats.unwateredBuildings} dry buildings (${waterMargin >= 0 ? `+${waterMargin}` : waterMargin} m³/d)`,
      whyLeaving: isWaterDeficit || stats.unwateredBuildings > 0
        ? 'Water pressure deficit! Lack of running water causes hygiene collapse and rapid building abandonment.'
        : 'Water supply is clean, pressurized, and adequately distributed across underground conduits.',
      remedy: 'Build a Water Tower (+8,000 m³/d) or Sewage Treatment Plant connected to roads.',
    },
    {
      id: 'housing',
      name: 'Housing Availability & Capacity',
      icon: Home,
      status: stats.housingOccupancy >= 92 ? 'warning' : 'optimal',
      metric: `${stats.housingOccupancy}% occupied (${housingVacancies} beds vacant)`,
      whyLeaving: stats.housingOccupancy >= 92
        ? 'Housing capacity is nearly exhausted! Aspiring newcomers cannot find shelter in the city and are turned away at highway exits.'
        : 'Adequate housing vacancies allow steady inflow of new families.',
      remedy: 'Paint new Residential zones or place Suburban Homes & Apartment Towers.',
    },
    {
      id: 'jobs',
      name: 'Employment & Labor Opportunity',
      icon: Briefcase,
      status: stats.unemploymentRate > 12 ? 'critical' : stats.unemploymentRate > 7 ? 'warning' : 'optimal',
      metric: `${stats.unemploymentRate}% unemployment (${stats.jobs - stats.employed} vacant jobs)`,
      whyLeaving: stats.unemploymentRate > 10
        ? 'Unemployment is too high! Jobless citizens exhaust savings and migrate to regional cities in search of work.'
        : stats.jobs > stats.employed
        ? 'Plentiful jobs available! Commercial and industrial sectors are actively recruiting workers.'
        : 'Labor market is well-balanced.',
      remedy: stats.unemploymentRate > 7
        ? 'Zone Commercial, Industrial, or Office districts to create job openings.'
        : 'Zone more Residential areas to supply workers for vacant factories and shops.',
    },
    {
      id: 'taxes',
      name: 'Taxation & Cost of Living',
      icon: DollarSign,
      status: budget.taxRateResidential > 12 ? 'warning' : 'optimal',
      metric: `${budget.taxRateResidential}% residential tax rate`,
      whyLeaving: budget.taxRateResidential > 12
        ? 'High tax rate (>12%) reduces citizen disposable income, depressing consumer spending and discouraging relocation.'
        : 'Fair municipal tax rates foster economic growth and attract new residents.',
      remedy: 'Keep residential taxes at or below 10-11% in the Economy panel.',
    },
    {
      id: 'pollution',
      name: 'Environmental Cleanliness & Smog',
      icon: Factory,
      status: stats.needsEnvironment < 65 ? 'warning' : 'optimal',
      metric: `${stats.needsEnvironment}% clean air index`,
      whyLeaving: stats.needsEnvironment < 65
        ? 'Heavy industrial smoke and dirty pollution near residential quarters harms health and triggers citizen departures.'
        : 'Fresh air and green open spaces keep citizens healthy and cheerful.',
      remedy: 'Buffer heavy factories away from residential blocks, and plant parks or trees.',
    },
    {
      id: 'services',
      name: 'Civic Healthcare & Education',
      icon: Stethoscope,
      status: stats.needsHealth < 40 || stats.needsEducation < 40 ? 'warning' : 'optimal',
      metric: `${stats.needsHealth}% health / ${stats.needsEducation}% education`,
      whyLeaving: stats.needsHealth < 40
        ? 'Lack of medical clinics and schools limits building upgrades to Level 1, capping resident density and living standards.'
        : 'Quality public services inspire high citizen retention and elevate neighborhood land values.',
      remedy: 'Build Clinics, Elementary Schools, and Police/Fire Stations within residential quarters.',
    },
  ];

  // Dynamically generated prioritized Action Plan to Increase Population
  const actionPlan = [];
  if (isPowerDeficit || stats.unpoweredBuildings > 0) {
    actionPlan.push({
      priority: 'Urgent',
      color: 'rose',
      title: 'Eliminate Electrical Deficit',
      detail: `Your city needs ${stats.powerConsumption} MW, but produces ${stats.powerProduction} MW. Build a Wind Turbine or Solar Farm immediately to stop building abandonment.`,
    });
  }
  if (isWaterDeficit || stats.unwateredBuildings > 0) {
    actionPlan.push({
      priority: 'Urgent',
      color: 'rose',
      title: 'Upgrade Potable Water Supply',
      detail: `Water consumption is ${stats.waterConsumption} m³/d vs ${stats.waterProduction} m³/d generated. Place a Water Tower connected to roads.`,
    });
  }
  if (stats.abandonedBuildings > 0) {
    actionPlan.push({
      priority: 'High',
      color: 'amber',
      title: 'Recover Abandoned Buildings',
      detail: `${stats.abandonedBuildings} buildings are abandoned. Ensure they have road access, power, and water; returning citizens will automatically repopulate them!`,
    });
  }
  if (stats.housingOccupancy >= 85) {
    actionPlan.push({
      priority: 'High',
      color: 'sky',
      title: 'Expand Residential Zoning (Housing Cap Reached)',
      detail: `Housing is at ${stats.housingOccupancy}% capacity (${housingVacancies} vacancies left). Zone new Residential areas or place Apartment Towers to accommodate newcomers.`,
    });
  }
  if (stats.unemploymentRate > 9) {
    actionPlan.push({
      priority: 'Medium',
      color: 'amber',
      title: 'Create Jobs in Commercial & Industrial',
      detail: `Unemployment is at ${stats.unemploymentRate}%. Zone Commercial storefronts, Industrial workshops, or Offices to give citizens productive jobs.`,
    });
  } else if (commercialVacancies > 10 || industrialVacancies > 10) {
    actionPlan.push({
      priority: 'Medium',
      color: 'emerald',
      title: 'Attract Workers to Fill Industrial & Commercial Vacancies',
      detail: `Businesses have open vacancies (${commercialVacancies} retail, ${industrialVacancies} industrial). Zone more housing to bring in workers.`,
    });
  }
  if (stats.needsHealth < 50 || stats.needsEducation < 50) {
    actionPlan.push({
      priority: 'Standard',
      color: 'indigo',
      title: 'Improve Public Services to Upgrade Homes',
      detail: 'Place Clinics, Elementary Schools, and Parks near homes. High happiness and land value trigger automatic upgrades to high-density buildings!',
    });
  }
  if (budget.taxRateResidential > 11) {
    actionPlan.push({
      priority: 'Standard',
      color: 'slate',
      title: 'Lower Taxes to Boost Migration',
      detail: `Residential tax is currently ${budget.taxRateResidential}%. Lowering it towards 9-10% creates strong migration magnetism.`,
    });
  }
  if (actionPlan.length === 0) {
    actionPlan.push({
      priority: 'Expansion',
      color: 'emerald',
      title: 'Balanced Metropolis: Ready for Growth',
      detail: 'All utilities and civic services are flourishing. Continue zoning residential, commercial, and industrial in equal measure!',
    });
  }

  // Needs satisfaction items
  const needsScores = [
    { label: 'Electrical Power', score: stats.needsPower, icon: Zap, color: 'amber' },
    { label: 'Clean Water', score: stats.needsWater, icon: Droplets, color: 'sky' },
    { label: 'Healthcare Access', score: stats.needsHealth, icon: Stethoscope, color: 'rose' },
    { label: 'Education Quality', score: stats.needsEducation, icon: GraduationCap, color: 'blue' },
    { label: 'Police & Fire Safety', score: stats.needsSafety, icon: ShieldCheck, color: 'indigo' },
    { label: 'Employment Opportunities', score: stats.needsJobs, icon: Briefcase, color: 'emerald' },
    { label: 'Tax Fairness', score: stats.needsTaxSatisfaction, icon: DollarSign, color: 'teal' },
    { label: 'Clean Air & Environment', score: stats.needsEnvironment, icon: Trees, color: 'emerald' },
  ];

  // Recent migration points for sparkline / history bar
  const recentHistory = history.length > 0 ? history.slice(-10) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-xs select-none flex flex-col max-h-[92vh] border ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b shrink-0 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/70 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  Metropolitan Utilities, Citizen Needs & Capacity
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-neutral-100 border-neutral-250 text-neutral-700'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  Week {stats.week}, {stats.year}
                </span>
              </div>
              <p className={`text-[11px] hidden xs:block ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Comprehensive diagnostics of power, water, sector capacities, and population growth drivers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900'
                  : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div
          className={`flex items-center gap-1.5 px-5 py-2 border-b shrink-0 overflow-x-auto ${
            isLight ? 'bg-neutral-100/70 border-neutral-200' : 'bg-neutral-900/40 border-neutral-800'
          }`}
        >
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Condensed Master Overview
          </button>
          <button
            onClick={() => setActiveFilter('utilities')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'utilities'
                ? 'bg-amber-600/25 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Utilities Grid</span>
            {(isPowerDeficit || isWaterDeficit) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-0.5 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveFilter('capacities')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'capacities'
                ? 'bg-sky-600/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3 h-3 text-sky-400" />
            <span>City Capacities & Inflow</span>
          </button>
          <button
            onClick={() => setActiveFilter('leaving')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'leaving'
                ? 'bg-rose-600/25 text-rose-300 border border-rose-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Why People Leave / Diagnostics</span>
            {(isPowerDeficit || isWaterDeficit || stats.abandonedBuildings > 0) && (
              <span className="text-[10px] font-bold px-1 rounded bg-rose-500/40 text-rose-300">
                Alert
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('needs')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'needs'
                ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Needs & Growth Guide</span>
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-115px)]">
          {/* Active Diagnostic Status Banner */}
          {(isPowerDeficit || isWaterDeficit || stats.abandonedBuildings > 0 || stats.unemploymentRate > 12) ? (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1 text-slate-300 min-w-0">
                <div className="font-bold text-rose-300 text-xs sm:text-sm flex items-center gap-2">
                  <span>Critical Citizen Departure & Utility Warning</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">
                    Action Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isPowerDeficit && `⚡ Electrical deficit of ${Math.abs(powerMargin)} MW is leaving ${stats.unpoweredBuildings} buildings dark. `}
                  {isWaterDeficit && `💧 Potable water deficit of ${Math.abs(waterMargin).toLocaleString()} m³/d is drying up neighborhood taps. `}
                  {stats.abandonedBuildings > 0 && `🏚️ ${stats.abandonedBuildings} buildings have been abandoned due to prolonged utility shortages. `}
                  {stats.unemploymentRate > 12 && `💼 High unemployment (${stats.unemploymentRate}%) is triggering citizen departures. `}
                  Restore missing utilities to reactivate buildings and trigger automatic citizen repopulation!
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white text-xs">Municipal Utilities & Grid Fully Operational</span>
                  <p className="text-[11px] text-slate-400">
                    Sufficient power generation ({stats.powerProduction} MW) and clean water supply ({stats.waterProduction.toLocaleString()} m³/d) are powering the city.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-900/40 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  Net Migration: {stats.netMigration >= 0 ? `+${stats.netMigration}` : stats.netMigration}/wk
                </span>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> Population
                </span>
                <span className={`text-[10px] font-mono font-bold ${stats.netMigration >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.netMigration >= 0 ? `+${stats.netMigration}` : stats.netMigration}/wk
                </span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white tabular-nums">
                  {stats.population.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  / {stats.housingCapacity} cap
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    stats.housingOccupancy > 90 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.min(100, stats.housingOccupancy)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Total Jobs
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {stats.unemploymentRate}% unemp
                </span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
                  {stats.jobs.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {stats.employed} filled
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${stats.jobs > 0 ? Math.min(100, (stats.employed / stats.jobs) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Power Grid
                </span>
                <span className={`text-[10px] font-mono font-bold ${isPowerDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {powerMargin >= 0 ? `+${powerMargin} MW` : `${powerMargin} MW`}
                </span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-mono font-bold tabular-nums ${isPowerDeficit ? 'text-rose-400' : 'text-white'}`}>
                  {stats.powerConsumption} <span className="text-xs text-slate-400 font-normal">/ {stats.powerProduction} MW</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isPowerDeficit ? 'bg-rose-500' : 'bg-amber-400'}`}
                  style={{ width: `${Math.min(100, powerLoadPct)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" /> Water Grid
                </span>
                <span className={`text-[10px] font-mono font-bold ${isWaterDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {waterMargin >= 0 ? `+${waterMargin}` : waterMargin} m³
                </span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-mono font-bold tabular-nums ${isWaterDeficit ? 'text-rose-400' : 'text-white'}`}>
                  {stats.waterConsumption} <span className="text-xs text-slate-400 font-normal">/ {stats.waterProduction} m³</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isWaterDeficit ? 'bg-rose-500' : 'bg-sky-400'}`}
                  style={{ width: `${Math.min(100, waterLoadPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Section 1: Municipal Utilities Supply vs Demand Graphs & Bar Charts */}
          {(activeFilter === 'all' || activeFilter === 'utilities') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Municipal Utilities Load & Transmission Charts
                </h3>
                <span className="text-[11px] text-slate-400">
                  Pipes & electrical transmission flow automatically through roads & 2-tile easements
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Electrical Power Grid Card */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Electrical Power Grid</div>
                        <span className="text-[10px] text-slate-400">Generation vs City-wide Consumption</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isPowerDeficit
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                          : powerLoadPct > 85
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      }`}
                    >
                      {isPowerDeficit ? 'DEFICIT OUTAGE' : powerLoadPct > 85 ? 'HIGH LOAD' : 'OPTIMAL SURPLUS'}
                    </span>
                  </div>

                  {/* Power Bar Chart Comparison */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Current Grid Load</span>
                      <span className="font-mono font-bold text-white">
                        {stats.powerConsumption} MW / {stats.powerProduction} MW ({powerLoadPct}%)
                      </span>
                    </div>

                    {/* Comparative Stacked Bar */}
                    <div className="w-full h-5 bg-slate-900 border border-slate-800 rounded-lg p-0.5 relative overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isPowerDeficit ? 'bg-gradient-to-r from-rose-600 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, powerLoadPct)}%` }}
                      />
                      {/* 100% threshold marker */}
                      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-600" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>0 MW</span>
                      <span>50%</span>
                      <span className="text-amber-300 font-mono font-bold">100% Cap ({stats.powerProduction} MW)</span>
                    </div>
                  </div>

                  {/* Power Outage Impact */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Unpowered Buildings:</span>
                    <span className={`font-mono font-bold ${stats.unpoweredBuildings > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {stats.unpoweredBuildings} buildings dark
                    </span>
                  </div>

                  {/* Quick Remedy Recommendation */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 text-[10px] text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {isPowerDeficit
                        ? '⚠️ Build a Wind Turbine (+60 MW) or Solar Farm (+160 MW) touching roads to restore light.'
                        : 'Grid capacity has ample reserve (+ ' + powerMargin + ' MW) to power additional zoned growth.'}
                    </span>
                  </div>
                </div>

                {/* Potable Water Grid Card */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Potable Water Grid</div>
                        <span className="text-[10px] text-slate-400">Pumping Output vs Daily Consumption</span>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isWaterDeficit
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                          : waterLoadPct > 85
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      }`}
                    >
                      {isWaterDeficit ? 'DEFICIT SHORTAGE' : waterLoadPct > 85 ? 'HIGH LOAD' : 'OPTIMAL SURPLUS'}
                    </span>
                  </div>

                  {/* Water Bar Chart Comparison */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Current Water Demand</span>
                      <span className="font-mono font-bold text-white">
                        {stats.waterConsumption.toLocaleString()} / {stats.waterProduction.toLocaleString()} m³/d ({waterLoadPct}%)
                      </span>
                    </div>

                    {/* Comparative Stacked Bar */}
                    <div className="w-full h-5 bg-slate-900 border border-slate-800 rounded-lg p-0.5 relative overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isWaterDeficit ? 'bg-gradient-to-r from-rose-600 to-rose-500' : 'bg-gradient-to-r from-sky-500 to-sky-400'
                        }`}
                        style={{ width: `${Math.min(100, waterLoadPct)}%` }}
                      />
                      {/* 100% threshold marker */}
                      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-600" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>0 m³</span>
                      <span>50%</span>
                      <span className="text-sky-300 font-mono font-bold">100% Cap ({stats.waterProduction.toLocaleString()} m³)</span>
                    </div>
                  </div>

                  {/* Water Outage Impact */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Unwatered Buildings:</span>
                    <span className={`font-mono font-bold ${stats.unwateredBuildings > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {stats.unwateredBuildings} buildings dry
                    </span>
                  </div>

                  {/* Quick Remedy Recommendation */}
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2 text-[10px] text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>
                      {isWaterDeficit
                        ? '⚠️ Construct a Water Tower (+8,000 m³/d) or Sewage Treatment Plant connected to roads.'
                        : 'Pumping stations maintain ample surplus (+ ' + waterMargin.toLocaleString() + ' m³/d) for expansion.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: City Capacities & Inflow Matrix (Residential, Commercial, Industrial, Office) */}
          {(activeFilter === 'all' || activeFilter === 'capacities') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  City Capacities & Sector Inflow Matrix
                </h3>
                <span className="text-[11px] text-slate-400">
                  How many people are living, working, and arriving across each urban sector
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Residential Sector */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-emerald-400" /> Residential
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      Demand {demands.residential}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400 text-[11px]">Housing Capacity</span>
                      <span className="font-mono font-bold text-white">
                        {stats.population} / {stats.housingCapacity} beds
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stats.housingOccupancy > 90 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, stats.housingOccupancy)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Occupancy: {stats.housingOccupancy}%</span>
                      <span>Vacant: {housingVacancies}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Weekly Inflow:</span>
                      <span className="font-mono font-bold text-emerald-400 flex items-center">
                        <ArrowUpRight className="w-3 h-3" /> +{stats.citizenInflow}/wk
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Weekly Outflow:</span>
                      <span className={`font-mono font-bold flex items-center ${stats.citizenOutflow > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        <ArrowDownRight className="w-3 h-3" /> -{stats.citizenOutflow}/wk
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Commercial Sector */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-sky-400" /> Commercial
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60">
                      Demand {demands.commercial}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400 text-[11px]">Retail Workforce</span>
                      <span className="font-mono font-bold text-white">
                        {stats.commercialEmployees} / {stats.commercialCapacity} jobs
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400"
                        style={{ width: `${stats.commercialCapacity > 0 ? Math.min(100, (stats.commercialEmployees / stats.commercialCapacity) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Staffed: {stats.commercialCapacity > 0 ? Math.round((stats.commercialEmployees / stats.commercialCapacity) * 100) : 0}%</span>
                      <span>Openings: {commercialVacancies}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shopper Inflow:</span>
                      <span className="font-mono font-bold text-sky-300">
                        ~{stats.commercialShoppers} visits/day
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Store Turnover:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${stats.commercialTurnover.toLocaleString()}/wk
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Industrial Sector */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-amber-400" /> Industrial
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                      Demand {demands.industrial}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400 text-[11px]">Factory Workforce</span>
                      <span className="font-mono font-bold text-white">
                        {stats.industrialEmployees} / {stats.industrialCapacity} jobs
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${stats.industrialCapacity > 0 ? Math.min(100, (stats.industrialEmployees / stats.industrialCapacity) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Staffed: {stats.industrialCapacity > 0 ? Math.round((stats.industrialEmployees / stats.industrialCapacity) * 100) : 0}%</span>
                      <span>Openings: {industrialVacancies}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Production Labor:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {stats.industrialEmployees} artisans/techs
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Highway Freight:</span>
                      <span className="font-mono font-bold text-slate-300">
                        {stats.highwayCommuters} trucks/wk
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Office Sector */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-purple-400" /> Office Towers
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">
                      Demand {demands.office}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-400 text-[11px]">Corporate Desks</span>
                      <span className="font-mono font-bold text-white">
                        {stats.officeEmployees} / {stats.officeCapacity} desks
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400"
                        style={{ width: `${stats.officeCapacity > 0 ? Math.min(100, (stats.officeEmployees / stats.officeCapacity) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Staffed: {stats.officeCapacity > 0 ? Math.round((stats.officeEmployees / stats.officeCapacity) * 100) : 0}%</span>
                      <span>Openings: {officeVacancies}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">University Inflow:</span>
                      <span className="font-mono font-bold text-purple-300">
                        {stats.universityRate}% graduates
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg Wage Paid:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${stats.averageIncome}/wk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Why Citizens Leave or Stay (Departure Diagnostics Breakdown) */}
          {(activeFilter === 'all' || activeFilter === 'leaving') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Why Citizens Leave or Stay (Diagnostic Outflow Breakdown)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    If people are leaving or buildings are abandoning, examine these core root factors and follow their direct remedy.
                  </p>
                </div>
                {stats.abandonedBuildings > 0 && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/80 text-rose-300">
                    {stats.abandonedBuildings} Abandoned Properties
                  </span>
                )}
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {departureFactors.map((factor) => {
                  const Icon = factor.icon;
                  const isCritical = factor.status === 'critical';
                  const isWarning = factor.status === 'warning';

                  return (
                    <div
                      key={factor.id}
                      className={`p-3 sm:p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCritical ? 'bg-rose-950/20' : isWarning ? 'bg-amber-950/10' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isCritical
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                              : isWarning
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{factor.name}</span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                isCritical
                                  ? 'bg-rose-900/60 text-rose-200 border-rose-700/80'
                                  : isWarning
                                  ? 'bg-amber-900/60 text-amber-200 border-amber-700/80'
                                  : 'bg-emerald-900/60 text-emerald-200 border-emerald-700/80'
                              }`}
                            >
                              {factor.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{factor.metric}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{factor.whyLeaving}</p>
                          <div className="text-[10px] text-sky-400 font-medium flex items-center gap-1 pt-0.5">
                            <Check className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>Remedy: {factor.remedy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Citizen Needs Satisfaction Scores (Horizontal Bar Charts) */}
          {(activeFilter === 'all' || activeFilter === 'needs') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Smile className="w-4 h-4 text-emerald-400" />
                    Citizen Needs Fulfillment Bar Charts
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    High fulfillment keeps happiness above 80%, triggering automatic building upgrades up to Level 5 skyscrapers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
                    City Happiness: {stats.cityHappiness}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {needsScores.map((need) => {
                  const Icon = need.icon;
                  const isLow = need.score < 50;
                  const isMedium = need.score >= 50 && need.score < 75;

                  return (
                    <div key={need.label} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          {need.label}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isLow ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {need.score}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow
                              ? 'bg-rose-500'
                              : isMedium
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, need.score))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Prioritized Action Plan to Increase Population */}
          {(activeFilter === 'all' || activeFilter === 'needs') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  What Needs To Be Done To Increase Population
                </h3>
                <span className="text-[11px] text-slate-400">
                  Priority guidance dynamically calculated from current bottlenecks
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actionPlan.map((action, idx) => {
                  const borderCol =
                    action.color === 'rose'
                      ? 'border-rose-800/80 bg-rose-950/25'
                      : action.color === 'amber'
                      ? 'border-amber-800/80 bg-amber-950/25'
                      : action.color === 'sky'
                      ? 'border-sky-800/80 bg-sky-950/25'
                      : 'border-emerald-800/80 bg-emerald-950/25';

                  const badgeCol =
                    action.color === 'rose'
                      ? 'bg-rose-900/80 text-rose-200'
                      : action.color === 'amber'
                      ? 'bg-amber-900/80 text-amber-200'
                      : action.color === 'sky'
                      ? 'bg-sky-900/80 text-sky-200'
                      : 'bg-emerald-900/80 text-emerald-200';

                  return (
                    <div key={idx} className={`border rounded-xl p-3.5 space-y-1.5 ${borderCol}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{action.title}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${badgeCol}`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{action.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 6: Historical Population & Utility Growth Trajectory */}
          {recentHistory.length > 2 && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" /> Recent Migration Trajectory (Last {recentHistory.length} Weeks)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Weekly net inflow & population census
                </span>
              </div>

              {/* Bar visualization of population progression */}
              <div className="flex items-end gap-1.5 h-16 pt-2">
                {recentHistory.map((snap, i) => {
                  const maxPop = Math.max(...recentHistory.map((s) => s.population), 50);
                  const hPct = Math.max(12, Math.round((snap.population / maxPop) * 100));

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 hidden group-hover:flex items-center bg-slate-800 text-[10px] font-mono px-1.5 py-0.5 rounded text-white shadow-lg whitespace-nowrap z-20">
                        W{snap.week}: {snap.population} pop
                      </div>
                      <div
                        className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all"
                        style={{ height: `${hPct}%` }}
                      />
                      <span className="text-[9px] text-slate-500 font-mono">W{snap.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
