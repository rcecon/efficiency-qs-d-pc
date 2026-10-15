import { MarketParameters, MarketState, InitialBaseline } from '../types/economics';

// Standard baseline model parameters
export const DEFAULT_PARAMETERS: MarketParameters = {
  mcIntercept: 15,
  mcSlope: 0.7,
  dIntercept0: 90,
  dSlope: 0.8,
  deltaDemand: 0,
  priceCeiling: 36,
};

// Calculate MB at any given quantity Q
export function calculateMB(q: number, params: MarketParameters): number {
  return (params.dIntercept0 + params.deltaDemand) - (params.dSlope * q);
}

// Calculate MC at any given quantity Q
export function calculateMC(q: number, params: MarketParameters): number {
  return params.mcIntercept + (params.mcSlope * q);
}

// Calculate complete market state given parameters
export function calculateMarketState(params: MarketParameters): MarketState {
  const currentDIntercept = params.dIntercept0 + params.deltaDemand;
  
  // Market Equilibrium without price ceiling: MB(Q*) = MC(Q*)
  // currentDIntercept - dSlope * Q = mcIntercept + mcSlope * Q
  const eqQuantity = (currentDIntercept - params.mcIntercept) / (params.dSlope + params.mcSlope);
  const eqPrice = params.mcIntercept + (params.mcSlope * eqQuantity);
  
  // Effective price ceiling condition: Pc < Pe
  // Under the competitive assumption given: quantity transacted equals quantity supplied at Pc
  // Pc = mcIntercept + mcSlope * Qt => Qt = (Pc - mcIntercept) / mcSlope
  const effectivePc = Math.min(params.priceCeiling, eqPrice - 0.5);
  const transactedQuantity = Math.max(0, (effectivePc - params.mcIntercept) / params.mcSlope);
  
  // Quantity demanded at effective price ceiling
  const quantityDemandedAtPc = Math.max(0, (currentDIntercept - effectivePc) / params.dSlope);
  const shortage = Math.max(0, quantityDemandedAtPc - transactedQuantity);
  
  // Value of MB and MC at Qt
  const mbAtQt = calculateMB(transactedQuantity, params);
  const mcAtQt = calculateMC(transactedQuantity, params); // Equals effectivePc
  
  // DWL calculation
  // Since Qt < Q* and both curves are straight lines,
  // DWL is the triangular area between MB and MC from Qt to Q*
  const dwlHeight = Math.max(0, mbAtQt - mcAtQt);
  const dwlBase = Math.max(0, eqQuantity - transactedQuantity);
  const dwl = 0.5 * dwlHeight * dwlBase;
  
  // Consumer Surplus at Qt assuming consumers on the highest valuation segment get the goods:
  // Trapezoid from 0 to Qt under MB minus payment (Pc * Qt)
  const mbAtZero = currentDIntercept;
  const consumerSurplus = 0.5 * (mbAtZero - effectivePc + mbAtQt - effectivePc) * transactedQuantity;
  
  // Producer Surplus at Qt: Triangle under Pc down to MC
  const producerSurplus = 0.5 * (effectivePc - params.mcIntercept) * transactedQuantity;
  
  return {
    eqQuantity,
    eqPrice,
    transactedQuantity,
    quantityDemandedAtPc,
    shortage,
    mbAtQt,
    mcAtQt,
    dwlHeight,
    dwlBase,
    dwl,
    consumerSurplus,
    producerSurplus,
  };
}

// Baseline state for comparison
export const BASELINE: InitialBaseline = {
  parameters: { ...DEFAULT_PARAMETERS },
  state: calculateMarketState(DEFAULT_PARAMETERS),
};
