import React, { useState } from 'react';
import { MarketParameters, MarketState, InitialBaseline } from '../types/economics';
import { calculateMB, calculateMC } from '../utils/econCalculations';

interface EconomicsGraphProps {
  parameters: MarketParameters;
  state: MarketState;
  baseline: InitialBaseline;
  showInitialDWLOverlay: boolean;
  projectorMode: boolean;
}

export const EconomicsGraph: React.FC<EconomicsGraphProps> = ({
  parameters,
  state,
  baseline,
  showInitialDWLOverlay,
  projectorMode,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Graph coordinate ranges
  const maxQ = 85;
  const maxP = 115;

  // SVG dimensions
  const svgWidth = 740;
  const svgHeight = 540;
  const margin = { top: 40, right: 80, bottom: 60, left: 70 };

  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Scale functions
  const scaleX = (q: number) => margin.left + (q / maxQ) * plotWidth;
  const scaleY = (p: number) => margin.top + plotHeight - (p / maxP) * plotHeight;

  // Inverse scale helper
  const qAtP0 = (params: MarketParameters) => {
    return (params.dIntercept0 + params.deltaDemand) / params.dSlope;
  };

  // Coordinates for Current Demand (MB)
  const currentMB_Q0 = 0;
  const currentMB_P0 = parameters.dIntercept0 + parameters.deltaDemand;
  const currentMB_QEnd = Math.min(maxQ, qAtP0(parameters));
  const currentMB_PEnd = calculateMB(currentMB_QEnd, parameters);

  // Coordinates for Baseline Demand (MB0)
  const baseMB_Q0 = 0;
  const baseMB_P0 = baseline.parameters.dIntercept0;
  const baseMB_QEnd = Math.min(maxQ, qAtP0(baseline.parameters));
  const baseMB_PEnd = calculateMB(baseMB_QEnd, baseline.parameters);

  // Coordinates for Supply (MC)
  const mc_Q0 = 0;
  const mc_P0 = parameters.mcIntercept;
  const mc_QEnd = Math.min(maxQ, (maxP - parameters.mcIntercept) / parameters.mcSlope);
  const mc_PEnd = calculateMC(mc_QEnd, parameters);

  // Equilibrium points
  const eqX = scaleX(state.eqQuantity);
  const eqY = scaleY(state.eqPrice);

  const baseEqX = scaleX(baseline.state.eqQuantity);
  const baseEqY = scaleY(baseline.state.eqPrice);

  // Transaction points (Qt)
  const qtX = scaleX(state.transactedQuantity);
  const qtY_Pc = scaleY(state.mcAtQt);
  const qtY_MB = scaleY(state.mbAtQt);

  // Baseline transaction points
  const baseQtX = scaleX(baseline.state.transactedQuantity);
  const baseQtY_Pc = scaleY(baseline.state.mcAtQt);
  const baseQtY_MB = scaleY(baseline.state.mbAtQt);

  // Price Ceiling horizontal line coordinates
  const pcY = scaleY(parameters.priceCeiling);
  const basePcY = scaleY(baseline.parameters.priceCeiling);

  // Check if parameters changed from baseline
  const demandShifted = parameters.deltaDemand > 0.05;
  const ceilingShifted = Math.abs(parameters.priceCeiling - baseline.parameters.priceCeiling) > 0.1;

  return (
    <div className={`relative w-full rounded-2xl border transition-colors overflow-hidden ${
      projectorMode 
        ? 'bg-white border-slate-900 shadow-xl' 
        : 'bg-white/95 backdrop-blur-sm border-slate-200 shadow-sm'
    }`}>
      {/* Top Legend Bar */}
      <div className={`px-5 py-2.5 flex flex-wrap items-center justify-between border-b text-xs font-medium ${
        projectorMode ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span className="font-bold text-slate-900">D = MB</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span className="font-bold text-slate-900">S = MC</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span className="font-bold text-slate-900">Pc (Price Ceiling)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[11px]">
            Shaded Area = Deadweight Loss (DWL)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto flex justify-center py-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[760px] h-auto select-none"
          style={{ minWidth: '540px' }}
        >
          <defs>
            {/* DWL Diagonal Pattern */}
            <pattern id="dwlHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="2.5" opacity="0.6" />
            </pattern>
            {/* Baseline DWL Pattern */}
            <pattern id="baseDwlHatch" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="1.8" opacity="0.5" />
            </pattern>
            {/* Arrow Marker for Axes */}
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0f172a" />
            </marker>
          </defs>

          {/* Base DWL Overlay (When requested for comparison) */}
          {showInitialDWLOverlay && (
            <g opacity="0.85">
              <polygon
                points={`
                  ${baseQtX},${baseQtY_Pc}
                  ${baseQtX},${baseQtY_MB}
                  ${baseEqX},${baseEqY}
                `}
                fill="url(#baseDwlHatch)"
                stroke="#64748b"
                strokeWidth="1.8"
                strokeDasharray="4 3"
              />
              <text
                x={baseQtX + (baseEqX - baseQtX) * 0.35}
                y={baseQtY_MB + (baseQtY_Pc - baseQtY_MB) * 0.45}
                fontSize={projectorMode ? "13" : "11"}
                fontWeight="700"
                fill="#475569"
              >
                Initial DWL
              </text>
            </g>
          )}

          {/* CURRENT DEADWEIGHT LOSS (DWL) POLYGON */}
          <polygon
            points={`
              ${qtX},${qtY_Pc}
              ${qtX},${qtY_MB}
              ${eqX},${eqY}
            `}
            fill="url(#dwlHatch)"
            stroke="#e11d48"
            strokeWidth={projectorMode ? "2.5" : "2"}
            className="transition-all duration-300"
          />

          {/* Solid color wash under hatch */}
          <polygon
            points={`
              ${qtX},${qtY_Pc}
              ${qtX},${qtY_MB}
              ${eqX},${eqY}
            `}
            fill="#f43f5e"
            fillOpacity="0.18"
          />

          {/* DWL Center Label */}
          <g>
            <rect
              x={qtX + (eqX - qtX) * 0.3 - 26}
              y={(qtY_Pc + qtY_MB + eqY) / 3 - 13}
              width="54"
              height="24"
              rx="6"
              fill="#ffffff"
              stroke="#e11d48"
              strokeWidth="1.5"
              filter="drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))"
            />
            <text
              x={qtX + (eqX - qtX) * 0.3 + 1}
              y={(qtY_Pc + qtY_MB + eqY) / 3 + 4}
              textAnchor="middle"
              fontSize={projectorMode ? "14" : "12"}
              fontWeight="800"
              fill="#be123c"
            >
              DWL
            </text>
          </g>

          {/* Ghost Lines when shifted */}
          {demandShifted && (
            <g opacity="0.45">
              <line
                x1={scaleX(baseMB_Q0)}
                y1={scaleY(baseMB_P0)}
                x2={scaleX(baseMB_QEnd)}
                y2={scaleY(baseMB_PEnd)}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <text
                x={scaleX(baseMB_QEnd) - 15}
                y={scaleY(baseMB_PEnd) - 8}
                fill="#3b82f6"
                fontSize="12"
                fontWeight="700"
              >
                D₀ = MB₀
              </text>
            </g>
          )}

          {ceilingShifted && (
            <g opacity="0.45">
              <line
                x1={margin.left}
                y1={basePcY}
                x2={margin.left + plotWidth}
                y2={basePcY}
                stroke="#dc2626"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left + plotWidth - 10}
                y={basePcY - 6}
                textAnchor="end"
                fill="#dc2626"
                fontSize="11"
                fontWeight="700"
              >
                Pc₀
              </text>
            </g>
          )}

          {/* DEMAND CURVE (D = MB) */}
          <line
            x1={scaleX(currentMB_Q0)}
            y1={scaleY(currentMB_P0)}
            x2={scaleX(currentMB_QEnd)}
            y2={scaleY(currentMB_PEnd)}
            stroke="#2563eb"
            strokeWidth={projectorMode ? "4" : "3.2"}
            strokeLinecap="round"
          />
          {/* Label for D = MB */}
          <text
            x={Math.min(scaleX(currentMB_QEnd) + 6, margin.left + plotWidth + 12)}
            y={scaleY(currentMB_PEnd) + 4}
            fill="#1d4ed8"
            fontSize={projectorMode ? "16" : "14"}
            fontWeight="800"
          >
            {demandShifted ? "D₁ = MB₁" : "D = MB"}
          </text>

          {/* Demand shift arrow if shifted */}
          {demandShifted && (
            <g>
              <line
                x1={scaleX(20)}
                y1={scaleY(calculateMB(20, baseline.parameters))}
                x2={scaleX(20)}
                y2={scaleY(calculateMB(20, parameters))}
                stroke="#2563eb"
                strokeWidth="2.2"
                markerEnd="url(#arrow)"
              />
            </g>
          )}

          {/* SUPPLY CURVE (S = MC) */}
          <line
            x1={scaleX(mc_Q0)}
            y1={scaleY(mc_P0)}
            x2={scaleX(mc_QEnd)}
            y2={scaleY(mc_PEnd)}
            stroke="#059669"
            strokeWidth={projectorMode ? "4" : "3.2"}
            strokeLinecap="round"
          />
          {/* Label for S = MC */}
          <text
            x={scaleX(mc_QEnd) + 6}
            y={scaleY(mc_PEnd) + 4}
            fill="#047857"
            fontSize={projectorMode ? "16" : "14"}
            fontWeight="800"
          >
            S = MC
          </text>

          {/* PRICE CEILING LINE (Pc) */}
          <line
            x1={margin.left}
            y1={pcY}
            x2={margin.left + plotWidth}
            y2={pcY}
            stroke="#dc2626"
            strokeWidth={projectorMode ? "3.5" : "2.8"}
            strokeDasharray="6 3"
          />
          {/* Label for Pc */}
          <g>
            <rect
              x={margin.left + plotWidth + 6}
              y={pcY - 12}
              width={projectorMode ? "42" : "36"}
              height="24"
              rx="4"
              fill="#fee2e2"
              stroke="#ef4444"
              strokeWidth="1"
            />
            <text
              x={margin.left + plotWidth + (projectorMode ? 27 : 24)}
              y={pcY + 4}
              textAnchor="middle"
              fill="#b91c1c"
              fontSize={projectorMode ? "14" : "12"}
              fontWeight="800"
            >
              {ceilingShifted ? "Pc₁" : "Pc"}
            </text>
          </g>

          {/* Price ceiling rise arrow if shifted */}
          {ceilingShifted && (
            <g>
              <line
                x1={scaleX(12)}
                y1={basePcY}
                x2={scaleX(12)}
                y2={pcY}
                stroke="#dc2626"
                strokeWidth="2.2"
                markerEnd="url(#arrow)"
              />
            </g>
          )}

          {/* PROJECTIONS & LABELS */}

          {/* Equilibrium Projections (Qe and Pe) */}
          <line
            x1={eqX}
            y1={eqY}
            x2={eqX}
            y2={margin.top + plotHeight}
            stroke="#475569"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
          <line
            x1={eqX}
            y1={eqY}
            x2={margin.left}
            y2={eqY}
            stroke="#475569"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />

          {/* Transacted Quantity Qt Projection */}
          <line
            x1={qtX}
            y1={qtY_MB}
            x2={qtX}
            y2={margin.top + plotHeight}
            stroke="#e11d48"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* KEY POINTS (CIRCLES) & LABELS */}

          {/* 1. Market Equilibrium Point (MB = MC) */}
          <circle
            cx={eqX}
            cy={eqY}
            r={projectorMode ? "6" : "5"}
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint('equilibrium')}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          <text
            x={eqX + 10}
            y={eqY - 8}
            fill="#0f172a"
            fontSize={projectorMode ? "14" : "12"}
            fontWeight="800"
          >
            {demandShifted ? "E₁" : "E*"}
          </text>

          {/* 2. Transaction Point under Pc on MC: (Qt, Pc) */}
          <circle
            cx={qtX}
            cy={qtY_Pc}
            r={projectorMode ? "6" : "5"}
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint('transacted')}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          {/* Label MC on the dot (intersection of Qt line and S) */}
          <g>
            <rect
              x={qtX - 35}
              y={qtY_Pc - 11}
              width="28"
              height="22"
              rx="4"
              fill="#ecfdf5"
              stroke="#059669"
              strokeWidth="1.2"
            />
            <text
              x={qtX - 21}
              y={qtY_Pc + 5}
              textAnchor="middle"
              fill="#047857"
              fontSize={projectorMode ? "13" : "12"}
              fontWeight="800"
            >
              MC
            </text>
          </g>

          {/* 3. Valuation Point on MB at Qt: (Qt, MB(Qt)) */}
          <circle
            cx={qtX}
            cy={qtY_MB}
            r={projectorMode ? "6" : "5"}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint('valuation')}
            onMouseLeave={() => setHoveredPoint(null)}
          />
          {/* Label MB on the dot on the MB curve (intersection with line from Qt) */}
          <g>
            <rect
              x={qtX - 35}
              y={qtY_MB - 11}
              width="28"
              height="22"
              rx="4"
              fill="#eff6ff"
              stroke="#2563eb"
              strokeWidth="1.2"
            />
            <text
              x={qtX - 21}
              y={qtY_MB + 5}
              textAnchor="middle"
              fill="#1d4ed8"
              fontSize={projectorMode ? "13" : "12"}
              fontWeight="800"
            >
              MB
            </text>
          </g>

          {/* AXES (WITHOUT NUMBERS) */}

          {/* Vertical Price Axis (P) */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight + 10}
            x2={margin.left}
            y2={margin.top - 15}
            stroke="#0f172a"
            strokeWidth={projectorMode ? "3" : "2.2"}
            markerEnd="url(#arrow)"
          />
          {/* Axis Label P */}
          <text
            x={margin.left - 24}
            y={margin.top - 18}
            fill="#0f172a"
            fontSize={projectorMode ? "20" : "18"}
            fontWeight="900"
            fontFamily="serif"
          >
            P
          </text>

          {/* Horizontal Quantity Axis (Q) */}
          <line
            x1={margin.left - 10}
            y1={margin.top + plotHeight}
            x2={margin.left + plotWidth + 25}
            y2={margin.top + plotHeight}
            stroke="#0f172a"
            strokeWidth={projectorMode ? "3" : "2.2"}
            markerEnd="url(#arrow)"
          />
          {/* Axis Label Q */}
          <text
            x={margin.left + plotWidth + 36}
            y={margin.top + plotHeight + 6}
            fill="#0f172a"
            fontSize={projectorMode ? "20" : "18"}
            fontWeight="900"
            fontFamily="serif"
          >
            Q
          </text>

          {/* Origin 0 */}
          <text
            x={margin.left - 14}
            y={margin.top + plotHeight + 18}
            fill="#64748b"
            fontSize="12"
            fontWeight="700"
          >
            0
          </text>

          {/* AXIS LABELS (NO ACTUAL NUMBERS) */}

          {/* Pc label on P axis */}
          <g>
            <rect
              x={margin.left - 42}
              y={pcY - 11}
              width="36"
              height="22"
              rx="4"
              fill="#fee2e2"
              stroke="#f87171"
              strokeWidth="1"
            />
            <text
              x={margin.left - 24}
              y={pcY + 4}
              textAnchor="middle"
              fill="#b91c1c"
              fontSize={projectorMode ? "13" : "12"}
              fontWeight="800"
            >
              {ceilingShifted ? "Pc₁" : "Pc"}
            </text>
          </g>

          {/* Pe label on P axis */}
          <g>
            <rect
              x={margin.left - 42}
              y={eqY - 11}
              width="36"
              height="22"
              rx="4"
              fill="#f1f5f9"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text
              x={margin.left - 24}
              y={eqY + 4}
              textAnchor="middle"
              fill="#0f172a"
              fontSize={projectorMode ? "13" : "12"}
              fontWeight="800"
            >
              {demandShifted ? "Pe₁" : "Pe"}
            </text>
          </g>

          {/* Qt label on Q axis */}
          <g>
            <rect
              x={qtX - 22}
              y={margin.top + plotHeight + 8}
              width="44"
              height="24"
              rx="4"
              fill="#fee2e2"
              stroke="#ef4444"
              strokeWidth="1"
            />
            <text
              x={qtX}
              y={margin.top + plotHeight + 24}
              textAnchor="middle"
              fill="#b91c1c"
              fontSize={projectorMode ? "14" : "13"}
              fontWeight="900"
            >
              Qₜ
            </text>
          </g>

          {/* Qe label on Q axis */}
          <g>
            <rect
              x={eqX - 22}
              y={margin.top + plotHeight + 8}
              width="44"
              height="24"
              rx="4"
              fill="#f1f5f9"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <text
              x={eqX}
              y={margin.top + plotHeight + 24}
              textAnchor="middle"
              fill="#0f172a"
              fontSize={projectorMode ? "14" : "13"}
              fontWeight="900"
            >
              {demandShifted ? "Qe₁" : "Qe"}
            </text>
          </g>

          {/* Tooltips (Text only, no numbers) */}
          {hoveredPoint === 'equilibrium' && (
            <g>
              <rect
                x={eqX - 85}
                y={eqY - 38}
                width="170"
                height="28"
                rx="6"
                fill="#0f172a"
                opacity="0.95"
              />
              <text x={eqX} y={eqY - 20} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
                Market Equilibrium (MB = MC)
              </text>
            </g>
          )}

          {hoveredPoint === 'transacted' && (
            <g>
              <rect
                x={qtX - 100}
                y={qtY_Pc - 38}
                width="200"
                height="28"
                rx="6"
                fill="#0f172a"
                opacity="0.95"
              />
              <text x={qtX} y={qtY_Pc - 20} textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="700">
                Transacted Quantity at Pc (Qₜ = Qs)
              </text>
            </g>
          )}

          {hoveredPoint === 'valuation' && (
            <g>
              <rect
                x={qtX - 85}
                y={qtY_MB - 38}
                width="170"
                height="28"
                rx="6"
                fill="#0f172a"
                opacity="0.95"
              />
              <text x={qtX} y={qtY_MB - 20} textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">
                Marginal Benefit at Qₜ: MB(Qₜ)
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Graph Caption Footer (Textbook style, no numbers) */}
      <div className={`px-5 py-2.5 border-t text-xs flex flex-wrap items-center justify-between gap-2 ${
        projectorMode ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-50/70 border-slate-100 text-slate-600'
      }`}>
        <div className="flex items-center gap-4">
          <span><strong className="text-slate-900">Qe:</strong> Equilibrium quantity (Efficient output)</span>
          <span><strong className="text-rose-700">Qₜ:</strong> Quantity transacted under price ceiling</span>
          <span><strong className="text-amber-800">Underproduction:</strong> Qe - Qₜ</span>
        </div>
        <div className="text-slate-500 italic">
          *Competitive market: Qₜ is restricted by quantity supplied at Pc
        </div>
      </div>
    </div>
  );
};
