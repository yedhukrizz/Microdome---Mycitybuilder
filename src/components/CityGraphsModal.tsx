import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Smile,
  BarChart3,
  Briefcase,
  Users,
  Building2,
  BookOpen,
  Zap,
  Droplets,
  AlertTriangle,
  Factory,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { CityHistorySnapshot, CityStats, CityDemands, CityBudget } from '../types/city';
import { useTheme } from '../context/ThemeContext';

interface CityGraphsModalProps {
  stats: CityStats;
  demands: CityDemands;
  budget: CityBudget;
  history: CityHistorySnapshot[];
  initialTab?: TabType;
  onClose: () => void;
}

type TabType = 'education' | 'income' | 'demands' | 'happiness' | 'utilities';

export const CityGraphsModal: React.FC<CityGraphsModalProps> = ({
  stats,
  demands,
  budget,
  history,
  initialTab = 'education',
  onClose,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Prepare graph points
  const points = history.length > 0 ? history : [
    {
      week: stats.week,
      year: stats.year,
      population: stats.population,
      employed: stats.employed,
      jobs: stats.jobs,
      unemploymentRate: stats.unemploymentRate,
      averageIncome: stats.averageIncome,
      educationLevel: stats.educationLevel,
      uneducatedRate: stats.uneducatedRate,
      highSchoolRate: stats.highSchoolRate,
      universityRate: stats.universityRate,
      cityHappiness: stats.cityHappiness,
      demandResidential: demands.residential,
      demandCommercial: demands.commercial,
      demandIndustrial: demands.industrial,
      demandOffice: demands.office,
      treasury: budget.treasury,
      weeklyIncome: budget.incomePerWeek,
      weeklyExpenses: budget.expensesPerWeek,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-none border ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-neutral-950 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black/60 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span>City Analytics & Population Simulation</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isLight ? 'bg-neutral-100 border-neutral-250 text-neutral-600' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  W{stats.week} '{stats.year % 100}
                </span>
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Real-time algorithmic education, household earnings, demands, and happiness tracking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900'
                : 'hover:bg-neutral-900 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-1 px-4 py-2 border-b text-xs overflow-x-auto shrink-0 ${
            isLight ? 'bg-neutral-100/70 border-neutral-200' : 'bg-neutral-900/40 border-neutral-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'education'
                ? isLight
                  ? 'bg-sky-100 text-sky-800 border border-sky-300 font-bold'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Education & Schools</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'income'
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Earnings & Jobs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demands')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'demands'
                ? isLight
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>R-C-I-O Demand</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('happiness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'happiness'
                ? isLight
                  ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Happiness & Living</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('utilities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'utilities'
                ? isLight
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Utilities & Capacities</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'education' && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Education Index</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-sky-400">{stats.educationLevel}</span>
                    <span className="text-[10px] text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Literacy & Skills</span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Student Enrollment</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-white">{stats.studentsEnrolled}</span>
                    <span className="text-[10px] text-slate-400">/ {stats.schoolCapacity} cap</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block mt-1">
                    {stats.schoolCapacity >= stats.studentsEnrolled ? '✓ Full Capacity' : '⚠️ Need Schools'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">High School Grads</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-emerald-400">{stats.highSchoolRate}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Skilled Workforce</span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">University Grads</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-purple-400">{stats.universityRate}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Powers Tech & Offices</span>
                </div>
              </div>

              {/* Education Distribution Breakdown Bar */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Population Education Tiers</span>
                  <span className="font-mono text-slate-400">Total Population: {stats.population}</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${stats.uneducatedRate}%` }}
                    className="bg-amber-400/80 transition-all duration-500"
                    title={`Uneducated: ${stats.uneducatedRate}%`}
                  />
                  <div
                    style={{ width: `${stats.highSchoolRate}%` }}
                    className="bg-sky-400/80 transition-all duration-500"
                    title={`High School: ${stats.highSchoolRate}%`}
                  />
                  <div
                    style={{ width: `${stats.universityRate}%` }}
                    className="bg-purple-400/80 transition-all duration-500"
                    title={`University Graduate: ${stats.universityRate}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Uneducated ({stats.uneducatedRate}%) · Basic Labor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    High School ({stats.highSchoolRate}%) · Commercial & Craft
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    University ({stats.universityRate}%) · Tech & Office
                  </span>
                </div>
              </div>

              {/* Education History Trendline Graph */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Education Level Over Time</span>
                  <span className="text-[10px] text-sky-400 font-mono">Past {points.length} Weeks</span>
                </div>
                <SvgLineChart
                  data={points.map((p) => p.educationLevel)}
                  maxVal={100}
                  color="#38bdf8"
                  fillColor="rgba(56, 189, 248, 0.15)"
                  unit="pts"
                />
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Average Weekly Wage</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-emerald-400">${stats.averageIncome}</span>
                    <span className="text-[10px] text-slate-400">/ wk</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Per Employed Citizen</span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Employment Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-white">
                      {100 - stats.unemploymentRate}%
                    </span>
                    <span className="text-[10px] text-slate-400">({stats.employed} jobs)</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Unemployment: {stats.unemploymentRate}%
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Weekly Economy Flow</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-sky-400">
                      ${stats.totalWagesPaid.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Total Wages Paid</span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Commercial Spending</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-amber-400">
                      ${stats.commercialTurnover.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">Drives Commercial Demand</span>
                </div>
              </div>

              {/* Average Income Trendline Graph */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Household Earnings Trend ($/wk)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Past {points.length} Weeks</span>
                </div>
                <SvgLineChart
                  data={points.map((p) => p.averageIncome)}
                  maxVal={1500}
                  color="#10b981"
                  fillColor="rgba(16, 185, 129, 0.15)"
                  unit="$"
                />
              </div>

              {/* Wages by Education explanation */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1.5">
                <span className="font-semibold text-white block">Income Multipliers:</span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-amber-400 font-bold block">Uneducated</span>
                    <span className="text-white font-mono">$420 / week</span>
                    <span className="text-slate-500 block">Basic industrial & retail</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-sky-400 font-bold block">High School</span>
                    <span className="text-white font-mono">$720 / week</span>
                    <span className="text-slate-500 block">Commercial & craft manufacturing</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-purple-400 font-bold block">University</span>
                    <span className="text-white font-mono">$1,380 / week</span>
                    <span className="text-slate-500 block">Offices, medical & technology</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demands' && (
            <div className="space-y-4">
              {/* RCI Demand Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">Residential Demand</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-emerald-400">{demands.residential}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Driven by {stats.jobs - stats.employed > 0 ? `${stats.jobs - stats.employed} open jobs` : 'housing needs'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-sky-400 font-bold block mb-0.5">Commercial Demand</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-sky-400">{demands.commercial}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Driven by ${stats.commercialTurnover} resident spending
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-amber-400 font-bold block mb-0.5">Industrial Demand</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-amber-400">{demands.industrial}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Driven by manufacturing & goods supply
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-0.5">Office Demand</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-cyan-400">{demands.office}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Driven by {stats.universityRate}% university graduates
                  </span>
                </div>
              </div>

              {/* Multi-Line Demands Graph */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Zoning Demand History</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Res
                    </span>
                    <span className="flex items-center gap-1 text-sky-400">
                      <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Com
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-0.5 bg-amber-400 inline-block" /> Ind
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Off
                    </span>
                  </div>
                </div>

                <SvgMultiLineChart
                  lines={[
                    { data: points.map((p) => p.demandResidential), color: '#10b981' },
                    { data: points.map((p) => p.demandCommercial), color: '#38bdf8' },
                    { data: points.map((p) => p.demandIndustrial), color: '#f59e0b' },
                    { data: points.map((p) => p.demandOffice), color: '#06b6d4' },
                  ]}
                  maxVal={100}
                />
              </div>
            </div>
          )}

          {activeTab === 'happiness' && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">City Happiness</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-purple-400">{stats.cityHappiness}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    {stats.cityHappiness > 80 ? 'Thrilled & Prosperous' : 'Satisfied'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Power Supply</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {stats.powerProduction} MW
                    </span>
                    <span className="text-[10px] text-slate-400">({stats.powerConsumption} req)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block mt-1">
                    {stats.powerProduction >= stats.powerConsumption ? '✓ Fully Powered' : '⚠️ Blackouts'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Water Supply</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-sky-400">
                      {Math.round(stats.waterProduction / 1000)}k m³
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block mt-1">
                    {stats.waterProduction >= stats.waterConsumption ? '✓ Clean Water' : '⚠️ Drought'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Treasury Revenue</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      +${budget.incomePerWeek}/wk
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    Expenses: -${budget.expensesPerWeek}/wk
                  </span>
                </div>
              </div>

              {/* Happiness Trendline Graph */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Overall Happiness Trendline</span>
                  <span className="text-[10px] text-purple-400 font-mono">Past {points.length} Weeks</span>
                </div>
                <SvgLineChart
                  data={points.map((p) => p.cityHappiness)}
                  maxVal={100}
                  color="#c084fc"
                  fillColor="rgba(192, 132, 252, 0.15)"
                  unit="%"
                />
              </div>
            </div>
          )}

          {activeTab === 'utilities' && (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Electrical Output</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-amber-400">{stats.powerConsumption}</span>
                    <span className="text-[10px] text-slate-400">/ {stats.powerProduction} MW</span>
                  </div>
                  <span className={`text-[9px] block mt-1 font-semibold ${stats.powerConsumption > stats.powerProduction ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {stats.powerConsumption > stats.powerProduction ? '⚠️ Power Deficit' : '✓ Grid Stable'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Potable Water</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-sky-400">{stats.waterConsumption}</span>
                    <span className="text-[10px] text-slate-400">/ {stats.waterProduction} m³</span>
                  </div>
                  <span className={`text-[9px] block mt-1 font-semibold ${stats.waterConsumption > stats.waterProduction ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {stats.waterConsumption > stats.waterProduction ? '⚠️ Water Shortage' : '✓ Supply Ample'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Housing Capacity</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-emerald-400">{stats.population}</span>
                    <span className="text-[10px] text-slate-400">/ {stats.housingCapacity}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1">
                    {stats.housingOccupancy}% Occupancy
                  </span>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Abandoned Properties</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl font-bold font-mono ${stats.abandonedBuildings > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {stats.abandonedBuildings}
                    </span>
                  </div>
                  <span className={`text-[9px] block mt-1 ${stats.abandonedBuildings > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}`}>
                    {stats.abandonedBuildings > 0 ? '⚠️ Abandonment Alert' : '✓ Zero Abandoned'}
                  </span>
                </div>
              </div>

              {/* Power Generation & Consumption Timeline */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-slate-200">Power Grid History (Generation vs Demand)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Production (MW)
                    </span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Demand (MW)
                    </span>
                  </div>
                </div>

                <SvgMultiLineChart
                  lines={[
                    { data: points.map((p) => p.powerProduction ?? stats.powerProduction), color: '#fbbf24' },
                    { data: points.map((p) => p.powerConsumption ?? stats.powerConsumption), color: '#f87171' },
                  ]}
                  maxVal={Math.max(
                    ...points.map((p) => Math.max(p.powerProduction ?? 0, p.powerConsumption ?? 0)),
                    stats.powerProduction,
                    stats.powerConsumption,
                    10
                  )}
                />
              </div>

              {/* Water Supply & Consumption Timeline */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-slate-200">Water Supply History (Production vs Demand)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-sky-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Output (m³)
                    </span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Demand (m³)
                    </span>
                  </div>
                </div>

                <SvgMultiLineChart
                  lines={[
                    { data: points.map((p) => p.waterProduction ?? stats.waterProduction), color: '#38bdf8' },
                    { data: points.map((p) => p.waterConsumption ?? stats.waterConsumption), color: '#818cf8' },
                  ]}
                  maxVal={Math.max(
                    ...points.map((p) => Math.max(p.waterProduction ?? 0, p.waterConsumption ?? 0)),
                    stats.waterProduction,
                    stats.waterConsumption,
                    1000
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable SVG Single Line & Area Chart
const SvgLineChart: React.FC<{
  data: number[];
  maxVal: number;
  color: string;
  fillColor: string;
  unit: string;
}> = ({ data, maxVal, color, fillColor, unit }) => {
  if (data.length === 0) return null;

  const w = 560;
  const h = 120;
  const pad = 12;

  const points = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = h - pad - (Math.min(maxVal, Math.max(0, v)) / maxVal) * (h - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${pad},${h - pad} L ${points.join(' L ')} L ${w - pad},${h - pad} Z`;

  const latestVal = data[data.length - 1];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={pad}
            y1={h - pad - pct * (h - pad * 2)}
            x2={w - pad}
            y2={h - pad - pct * (h - pad * 2)}
            stroke="#1e293b"
            strokeDasharray="3,3"
            strokeWidth="1"
          />
        ))}

        {/* Filled Area */}
        <path d={areaD} fill={fillColor} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {/* Last Point Dot */}
        {data.length > 0 && (
          <circle
            cx={w - pad}
            cy={h - pad - (Math.min(maxVal, Math.max(0, latestVal)) / maxVal) * (h - pad * 2)}
            r="4"
            fill={color}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1">
        <span>Week 1</span>
        <span className="text-slate-300 font-bold">
          Current: {latestVal} {unit}
        </span>
        <span>Latest</span>
      </div>
    </div>
  );
};

// Reusable SVG Multi-Line Chart
const SvgMultiLineChart: React.FC<{
  lines: { data: number[]; color: string }[];
  maxVal: number;
}> = ({ lines, maxVal }) => {
  const w = 560;
  const h = 120;
  const pad = 12;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={pad}
            y1={h - pad - pct * (h - pad * 2)}
            x2={w - pad}
            y2={h - pad - pct * (h - pad * 2)}
            stroke="#1e293b"
            strokeDasharray="3,3"
            strokeWidth="1"
          />
        ))}

        {lines.map((l, idx) => {
          if (l.data.length === 0) return null;
          const points = l.data.map((v, i) => {
            const x = pad + (i / Math.max(1, l.data.length - 1)) * (w - pad * 2);
            const y = h - pad - (Math.min(maxVal, Math.max(0, v)) / maxVal) * (h - pad * 2);
            return `${x},${y}`;
          });
          const pathD = `M ${points.join(' L ')}`;
          return (
            <path
              key={idx}
              d={pathD}
              fill="none"
              stroke={l.color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
};
