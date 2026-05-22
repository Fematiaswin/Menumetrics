import { roundCurrency, roundRate, roundTo } from "./money.js";
import { assertSolvableRate } from "./validation.js";

export function calculateAllocatedFixedExpense(params: {
  monthlyFixedExpenses: number;
  productVolumeEstimate: number;
  totalVolumeEstimate: number;
}): number {
  if (params.totalVolumeEstimate <= 0) {
    return 0;
  }

  const productMonthlyShare =
    params.monthlyFixedExpenses * (params.productVolumeEstimate / params.totalVolumeEstimate);

  return roundCurrency(productMonthlyShare / params.productVolumeEstimate);
}

export function calculateMinimumPrice(params: {
  totalUnitCost: number;
  salePercentageRate: number;
}): number {
  assertSolvableRate(params.salePercentageRate, "salePercentageRate");
  return roundCurrency(params.totalUnitCost / (1 - params.salePercentageRate));
}

export function calculateIdealPrice(params: {
  totalUnitCost: number;
  desiredMargin: number;
  salePercentageRate: number;
}): number {
  const totalRate = params.desiredMargin + params.salePercentageRate;
  assertSolvableRate(totalRate, "desiredMargin plus salePercentageRate");
  return roundCurrency(params.totalUnitCost / (1 - totalRate));
}

export function calculateRealMargin(params: {
  salePrice: number;
  totalUnitCost: number;
  salePercentageRate: number;
}): number {
  if (params.salePrice <= 0) {
    return -1;
  }

  const salePercentageValue = params.salePrice * params.salePercentageRate;
  return roundRate((params.salePrice - params.totalUnitCost - salePercentageValue) / params.salePrice);
}

export function calculateNetProfit(params: {
  salePrice: number;
  variableCostWithoutFixedExpenses: number;
  allocatedFixedExpense: number;
  salePercentageRate: number;
  volumeEstimate: number;
}): number {
  const salePercentageValue = params.salePrice * params.salePercentageRate;
  const unitContributionAfterFixedAllocation =
    params.salePrice - params.variableCostWithoutFixedExpenses - params.allocatedFixedExpense - salePercentageValue;

  return roundCurrency(unitContributionAfterFixedAllocation * params.volumeEstimate);
}

export function calculateBreakEvenUnits(params: {
  monthlyFixedExpenses: number;
  salePrice: number;
  variableCostWithoutFixedExpenses: number;
  salePercentageRate: number;
}): number | null {
  const salePercentageValue = params.salePrice * params.salePercentageRate;
  const contributionMargin = params.salePrice - params.variableCostWithoutFixedExpenses - salePercentageValue;

  if (contributionMargin <= 0) {
    return null;
  }

  return roundTo(params.monthlyFixedExpenses / contributionMargin, 2);
}

export function calculateHealthScore(params: {
  realMargin: number;
  netProfit: number;
  minimumPrice: number;
  salePrice: number;
  desiredMargin: number;
}): number {
  const marginScore = clamp((params.realMargin / Math.max(params.desiredMargin, 0.01)) * 45, 0, 45);
  const profitScore = params.netProfit > 0 ? 25 : params.netProfit === 0 ? 10 : 0;
  const priceDistanceScore = clamp(((params.salePrice - params.minimumPrice) / Math.max(params.minimumPrice, 0.01)) * 30, 0, 30);

  return Math.round(clamp(marginScore + profitScore + priceDistanceScore, 0, 100));
}

export function classifyHealthScore(score: number): "healthy" | "attention" | "loss" {
  if (score < 30) {
    return "loss";
  }

  if (score < 60) {
    return "attention";
  }

  return "healthy";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
