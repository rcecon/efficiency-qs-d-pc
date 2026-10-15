/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MarketParameters, ScenarioType } from './types/economics';
import { DEFAULT_PARAMETERS, calculateMarketState, BASELINE } from './utils/econCalculations';
import { EconomicsGraph } from './components/EconomicsGraph';
import { ControlPanel } from './components/ControlPanel';
import { Presentation, RotateCcw } from 'lucide-react';

export default function App() {
  const [parameters, setParameters] = useState<MarketParameters>({ ...DEFAULT_PARAMETERS });
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('initial');
  const [showExplanation, setShowExplanation] = useState<boolean>(true);
  const [showInitialDWLOverlay, setShowInitialDWLOverlay] = useState<boolean>(false);
  const [projectorMode, setProjectorMode] = useState<boolean>(false);

  // Derive calculated market state
  const state = calculateMarketState(parameters);

  // Parameter update handler
  const handleUpdateParameters = (newParams: Partial<MarketParameters>) => {
    setParameters((prev) => {
      const updated = { ...prev, ...newParams };
      // Check ceiling doesn't exceed eqPrice
      const currentDIntercept = updated.dIntercept0 + updated.deltaDemand;
      const eqQ = (currentDIntercept - updated.mcIntercept) / (updated.dSlope + updated.mcSlope);
      const eqP = updated.mcIntercept + updated.mcSlope * eqQ;
      
      if (updated.priceCeiling >= eqP) {
        updated.priceCeiling = Math.max(20, eqP - 1.5);
      }
      return updated;
    });
    setActiveScenario('custom');
  };

  // Scenario selection handler
  const handleSelectScenario = (scenario: ScenarioType) => {
    setActiveScenario(scenario);
    switch (scenario) {
      case 'initial':
        setParameters({
          ...DEFAULT_PARAMETERS,
          deltaDemand: 0,
          priceCeiling: 36,
        });
        break;
      case 'demand_only':
        setParameters({
          ...DEFAULT_PARAMETERS,
          deltaDemand: 16,
          priceCeiling: 36,
        });
        break;
      case 'ceiling_only':
        setParameters({
          ...DEFAULT_PARAMETERS,
          deltaDemand: 0,
          priceCeiling: 43,
        });
        break;
      case 'both_demand_dominant':
        setParameters({
          ...DEFAULT_PARAMETERS,
          deltaDemand: 22,
          priceCeiling: 38.5,
        });
        break;
      case 'both_ceiling_dominant':
        setParameters({
          ...DEFAULT_PARAMETERS,
          deltaDemand: 6,
          priceCeiling: 43.5,
        });
        break;
      case 'custom':
        break;
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      projectorMode 
        ? 'bg-slate-100 text-slate-900 font-sans' 
        : 'bg-gradient-to-br from-slate-50 via-slate-100/70 to-indigo-50/30 text-slate-900 font-sans'
    }`}>
      {/* Top Navigation */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between ${
        projectorMode ? 'bg-white border-slate-300 shadow-sm' : 'bg-white/80 border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                HKDSE Economics
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                Market Intervention & DWL
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Demand Shift, Effective Price Ceiling & Deadweight Loss
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Projector Mode Toggle */}
          <button
            onClick={() => setProjectorMode(!projectorMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              projectorMode
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="High contrast for projector display"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Projector Mode</span>
          </button>

          {/* Reset */}
          <button
            onClick={() => handleSelectScenario('initial')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            title="Reset to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Content: Clean 2-column layout */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Big Cartesian Graph (7 cols on lg) */}
          <div className="lg:col-span-7">
            <EconomicsGraph
              parameters={parameters}
              state={state}
              baseline={BASELINE}
              showInitialDWLOverlay={showInitialDWLOverlay}
              projectorMode={projectorMode}
            />
          </div>

          {/* Right Column: Teaching Scenarios (Moved Upwards) + Controls (5 cols on lg) */}
          <div className="lg:col-span-5">
            <ControlPanel
              parameters={parameters}
              state={state}
              baseline={BASELINE}
              onUpdateParameters={handleUpdateParameters}
              activeScenario={activeScenario}
              onSelectScenario={handleSelectScenario}
              projectorMode={projectorMode}
              showInitialDWLOverlay={showInitialDWLOverlay}
              onToggleInitialDWLOverlay={() => setShowInitialDWLOverlay(!showInitialDWLOverlay)}
              showExplanation={showExplanation}
              onToggleExplanation={() => setShowExplanation(!showExplanation)}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 mt-6 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
          <span>Competitive market assumption: Supply represents MC, Demand represents MB.</span>
          <span>Transacted quantity Qₜ equals quantity supplied at binding price ceiling Pc.</span>
        </footer>
      </main>
    </div>
  );
}
