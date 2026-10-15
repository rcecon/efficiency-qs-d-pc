export interface MarketParameters {
  // Supply curve MC: P = mcIntercept + mcSlope * Q
  mcIntercept: number;
  mcSlope: number;
  
  // Base Demand curve MB0: P = dIntercept0 - dSlope * Q
  dIntercept0: number;
  dSlope: number;
  
  // Current Demand shift: P = (dIntercept0 + deltaDemand) - dSlope * Q
  deltaDemand: number;
  
  // Effective Price Ceiling
  priceCeiling: number;
}

export interface MarketState {
  // Equilibrium without price control
  eqQuantity: number; // Q* or Qe
  eqPrice: number;    // P* or Pe
  
  // Under binding price ceiling
  transactedQuantity: number; // Qt (equals quantity supplied at Pc)
  quantityDemandedAtPc: number; // Qd at Pc
  shortage: number; // Qd - Qt
  
  // Valuations at Qt
  mbAtQt: number; // MB(Qt)
  mcAtQt: number; // MC(Qt) = Pc
  
  // DWL Triangle dimensions
  dwlHeight: number; // MB(Qt) - Pc
  dwlBase: number;   // Q* - Qt
  dwl: number;       // 0.5 * dwlHeight * dwlBase
  
  // Consumer and Producer Surplus (optional textbook extension)
  consumerSurplus: number;
  producerSurplus: number;
}

export interface InitialBaseline {
  parameters: MarketParameters;
  state: MarketState;
}

export type ScenarioType = 
  | 'initial'
  | 'demand_only'
  | 'ceiling_only'
  | 'both_demand_dominant'
  | 'both_ceiling_dominant'
  | 'custom';

export type DWLChangeStatus = 'increases' | 'decreases' | 'unchanged';
