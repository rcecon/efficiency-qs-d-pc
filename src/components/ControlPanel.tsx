import React from 'react';
import { MarketParameters, MarketState, InitialBaseline, ScenarioType, DWLChangeStatus } from '../types/economics';
import { RotateCcw, ArrowUpRight, ArrowUpCircle, Shuffle, Sparkles, TrendingUp, TrendingDown, Minus, Eye, EyeOff, BookOpen } from 'lucide-react';

interface ControlPanelProps {
  parameters: MarketParameters;
  state: MarketState;
  baseline: InitialBaseline;
  onUpdateParameters: (newParams: Partial<MarketParameters>) => void;
  activeScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
  projectorMode: boolean;
  showInitialDWLOverlay: boolean;
  onToggleInitialDWLOverlay: () => void;
  showExplanation: boolean;
  onToggleExplanation: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  parameters,
  state,
  baseline,
  onUpdateParameters,
  activeScenario,
  onSelectScenario,
  projectorMode,
  showInitialDWLOverlay,
  onToggleInitialDWLOverlay,
  showExplanation,
  onToggleExplanation,
}) => {
  // Maximum effective price ceiling is just below the equilibrium price
  const maxPriceCeiling = Math.floor(state.eqPrice - 1.5);
  const minPriceCeiling = 22;

  // Derive qualitative DWL status by comparing calculated values behind the scenes
  const dwlDiff = state.dwl - baseline.state.dwl;
  let status: DWLChangeStatus = 'unchanged';
  let statusMessage = 'DWL remains unchanged';
  let badgeStyle = 'bg-slate-100 text-slate-800 border-slate-300';
  let StatusIcon = Minus;

  if (dwlDiff > 0.5) {
    status = 'increases';
    statusMessage = 'DWL increases';
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-200';
    StatusIcon = TrendingUp;
  } else if (dwlDiff < -0.5) {
    status = 'decreases';
    statusMessage = 'DWL decreases';
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200';
    StatusIcon = TrendingDown;
  }

  // Handle slider changes without showing numbers
  const handleDemandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deltaDemand = parseFloat(e.target.value);
    onUpdateParameters({ deltaDemand });
  };

  const handleCeilingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priceCeiling = parseFloat(e.target.value);
    onUpdateParameters({ priceCeiling });
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all space-y-4 ${
      projectorMode 
        ? 'bg-white border-slate-800 shadow-md' 
        : 'bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm'
    }`}>
      {/* 1. SCENARIO BUTTONS (MOVED UPWARDS) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Teaching Scenarios
          </label>
          <span className="text-[11px] text-slate-400 font-medium">Select a case to demonstrate</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Button 1: Reset */}
          <button
            onClick={() => onSelectScenario('initial')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeScenario === 'initial'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Button 2: Demand Increases Only */}
          <button
            onClick={() => onSelectScenario('demand_only')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeScenario === 'demand_only'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200'
                : 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 border-blue-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Demand Increases Only</span>
          </button>

          {/* Button 3: Price Ceiling Rises Only */}
          <button
            onClick={() => onSelectScenario('ceiling_only')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeScenario === 'ceiling_only'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200'
                : 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 border-rose-200'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Price Ceiling Rises Only</span>
          </button>

          {/* Button 4: Both Changes */}
          <button
            onClick={() => onSelectScenario('both_demand_dominant')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeScenario === 'both_demand_dominant' || activeScenario === 'both_ceiling_dominant'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Both Changes</span>
          </button>
        </div>

        {/* Sub-options for Both Changes */}
        {(activeScenario === 'both_demand_dominant' || activeScenario === 'both_ceiling_dominant' || (parameters.deltaDemand > 0 && parameters.priceCeiling !== 36)) && (
          <div className="mt-2.5 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Selectable Examples for "Both Changes":</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => onSelectScenario('both_demand_dominant')}
                className={`p-2 rounded-lg font-semibold text-left transition-all border ${
                  activeScenario === 'both_demand_dominant'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                }`}
              >
                1. Demand effect larger
                <span className="block text-[10px] opacity-80 font-normal">DWL increases overall</span>
              </button>
              <button
                onClick={() => onSelectScenario('both_ceiling_dominant')}
                className={`p-2 rounded-lg font-semibold text-left transition-all border ${
                  activeScenario === 'both_ceiling_dominant'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                }`}
              >
                2. Price ceiling effect larger
                <span className="block text-[10px] opacity-80 font-normal">DWL decreases overall</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. PROMINENT QUALITATIVE DWL RESULT BANNER (NO NUMBERS) */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${badgeStyle}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/80 shadow-xs">
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Effect on Deadweight Loss
            </div>
            <div className="text-lg font-black tracking-tight">
              {statusMessage}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleExplanation}
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-xs"
        >
          {showExplanation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showExplanation ? "Hide Explanation" : "Explanation"}</span>
        </button>
      </div>

      {/* 3. QUALITATIVE ECONOMIC EXPLANATION (NO NUMBERS) */}
      {showExplanation && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Economic Logic:</span>
          </div>

          {activeScenario === 'initial' && (
            <p className="leading-relaxed text-slate-600">
              The market is under a binding price ceiling (<strong>Pc &lt; Pe</strong>). Transacted output is restricted to quantity supplied at the ceiling (<strong>Qₜ</strong>), which is below efficient output (<strong>Qe</strong>). The shaded area represents the baseline deadweight loss (DWL).
            </p>
          )}

          {activeScenario === 'demand_only' && (
            <p className="leading-relaxed text-slate-600">
              Demand increases and shifts upwards to <strong>D₁</strong>. Efficient output increases from <strong>Qe</strong> to <strong>Qe₁</strong>. However, because the price ceiling is unchanged, producers have no price incentive to supply more, so <strong>Qₜ remains unchanged</strong>. The underproduction gap widens, so <strong>DWL unambiguously increases</strong>.
            </p>
          )}

          {activeScenario === 'ceiling_only' && (
            <p className="leading-relaxed text-slate-600">
              The price ceiling rises to <strong>Pc₁</strong>. Demand remains unchanged, so <strong>Qe is unchanged</strong>. Producers receive a higher price and expand supply along MC to <strong>Qₜ₁</strong>. Output moves closer to efficiency and the underproduction gap shrinks, so <strong>DWL unambiguously decreases</strong>.
            </p>
          )}

          {(activeScenario === 'both_demand_dominant' || activeScenario === 'both_ceiling_dominant' || activeScenario === 'custom') && (
            <p className="leading-relaxed text-slate-600">
              The two changes exert opposite forces on DWL: the increase in demand works to <strong>increase DWL</strong>, whereas the rise in price ceiling works to <strong>decrease DWL</strong>. When both occur together, the net change in DWL is <strong>indeterminate</strong> and depends on which effect is larger.
            </p>
          )}
        </div>
      )}

      {/* 4. SLIDERS (NO ACTUAL NUMBERS) */}
      <div className="pt-2 space-y-4">
        {/* Slider A: Demand */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/90">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="demand-slider" className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span>Increase in Demand</span>
            </label>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {parameters.deltaDemand > 0 ? "Shifted Upwards" : "Initial Demand"}
            </span>
          </div>

          <input
            id="demand-slider"
            type="range"
            min="0"
            max="30"
            step="1"
            value={parameters.deltaDemand}
            onChange={handleDemandChange}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>Initial (D₀)</span>
            <span>Parallel upward shift (D₁)</span>
          </div>
        </div>

        {/* Slider B: Price Ceiling */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/90">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="ceiling-slider" className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
              <span>Price Ceiling (Pc)</span>
            </label>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {parameters.priceCeiling > baseline.parameters.priceCeiling ? "Higher Ceiling" : "Initial Ceiling"}
            </span>
          </div>

          <input
            id="ceiling-slider"
            type="range"
            min={minPriceCeiling}
            max={maxPriceCeiling}
            step="0.5"
            value={parameters.priceCeiling}
            onChange={handleCeilingChange}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>Lower Ceiling</span>
            <span>Higher Ceiling (Binding)</span>
          </div>
        </div>
      </div>

      {/* 5. VISUAL OVERLAY TOGGLE & RESET */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
          <input
            type="checkbox"
            checked={showInitialDWLOverlay}
            onChange={onToggleInitialDWLOverlay}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>Overlay Initial DWL (Compare)</span>
        </label>

        <button
          onClick={() => onSelectScenario('initial')}
          className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline underline-offset-2 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Reset to initial
        </button>
      </div>
    </div>
  );
};
