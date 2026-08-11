export interface RiskInput {
  financialRiskScore: number;       // 1 - 5
  deliveryCapabilityScore: number;  // 1 - 5
  strategicAlignmentScore: number;  // 1 - 5 (1 = highly aligned/low risk, 5 = poorly aligned/high risk)
}

export interface CalculatedRiskProfile {
  weightedScore: number;
  overallRating: 'LOW' | 'MEDIUM' | 'HIGH';
  justificationNotes: string;
}

export class RiskService {
  /**
   * Calculates the overall risk rating based on weights:
   * - Financial Risk: 40%
   * - Delivery Capability: 35%
   * - Strategic Non-Alignment: 25% (higher score means poor alignment / higher risk)
   */
  public static calculateRisk(input: RiskInput): CalculatedRiskProfile {
    const { financialRiskScore, deliveryCapabilityScore, strategicAlignmentScore } = input;
    
    // Bounds check
    const f = Math.max(1, Math.min(5, financialRiskScore));
    const d = Math.max(1, Math.min(5, deliveryCapabilityScore));
    const s = Math.max(1, Math.min(5, strategicAlignmentScore));

    const weightedScore = parseFloat(((f * 0.4) + (d * 0.35) + (s * 0.25)).toFixed(2));

    let overallRating: 'LOW' | 'MEDIUM' | 'HIGH';
    let justificationNotes = '';

    if (weightedScore < 2.5) {
      overallRating = 'LOW';
      justificationNotes = 'The proposal represents a low overall risk profile. Financial exposures are minimal, delivery capacity is well within existing resources, and the grant is highly aligned with strategic initiatives.';
    } else if (weightedScore < 3.8) {
      overallRating = 'MEDIUM';
      justificationNotes = 'The proposal carries a moderate level of risk. Careful resource planning and budget monitoring will be required during execution. Strategic alignment is acceptable, but some capacity constraints exist.';
    } else {
      overallRating = 'HIGH';
      justificationNotes = 'CRITICAL WARNING: This project represents a high risk profile. Major delivery bottlenecks, financial shortfalls, or significant strategic misalignment have been identified. Executive sign-off and risk-mitigation registers are mandatory.';
    }

    return {
      weightedScore,
      overallRating,
      justificationNotes
    };
  }
}
