export type DishStatus = "healthy" | "attention" | "loss";

export interface DishMetric {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  idealPrice: number;
  recipeCost: number;
  margin: number;
  monthlySales: number;
  monthlyProfit: number;
  status: DishStatus;
  quadrant: "Estrela" | "Ajustar preco" | "Rever receita" | "Promover";
}

export interface IngredientMetric {
  id: string;
  name: string;
  currentCost: number;
  variation: number;
  affectedDishes: number;
  monthlyImpact: number;
}

export interface ProfitAlert {
  id: string;
  severity: "critical" | "warning" | "ok";
  title: string;
  message: string;
  impact: number;
}

export const dishMetrics: DishMetric[] = [
  {
    id: "pizza-mussarela",
    name: "Pizza mussarela",
    category: "Pizzas",
    currentPrice: 45,
    idealPrice: 38.33,
    recipeCost: 18,
    margin: 0.3889,
    monthlySales: 100,
    monthlyProfit: 1750,
    status: "healthy",
    quadrant: "Estrela"
  },
  {
    id: "burger-artesanal",
    name: "Burger artesanal",
    category: "Sanduiches",
    currentPrice: 34,
    idealPrice: 36.8,
    recipeCost: 17.2,
    margin: 0.254,
    monthlySales: 180,
    monthlyProfit: 1548,
    status: "attention",
    quadrant: "Ajustar preco"
  },
  {
    id: "pizza-promocional",
    name: "Pizza promocional",
    category: "Promocoes",
    currentPrice: 22,
    idealPrice: 38.33,
    recipeCost: 18,
    margin: -0.1364,
    monthlySales: 100,
    monthlyProfit: -270,
    status: "loss",
    quadrant: "Rever receita"
  },
  {
    id: "brownie",
    name: "Brownie da casa",
    category: "Sobremesas",
    currentPrice: 16,
    idealPrice: 14.2,
    recipeCost: 5.1,
    margin: 0.431,
    monthlySales: 34,
    monthlyProfit: 235,
    status: "healthy",
    quadrant: "Promover"
  }
];

export const ingredientMetrics: IngredientMetric[] = [
  {
    id: "queijo",
    name: "Queijo mussarela",
    currentCost: 48,
    variation: 0.2,
    affectedDishes: 3,
    monthlyImpact: -412
  },
  {
    id: "carne",
    name: "Blend bovino",
    currentCost: 36,
    variation: 0.11,
    affectedDishes: 2,
    monthlyImpact: -188
  },
  {
    id: "embalagem",
    name: "Caixa delivery",
    currentCost: 1.9,
    variation: -0.07,
    affectedDishes: 5,
    monthlyImpact: 96
  }
];

export const profitAlerts: ProfitAlert[] = [
  {
    id: "alert-promo",
    severity: "critical",
    title: "Pizza promocional esta queimando dinheiro",
    message: "O preco atual esta R$ 16,33 abaixo do ideal e gera prejuizo mensal estimado.",
    impact: -270
  },
  {
    id: "alert-cheese",
    severity: "warning",
    title: "Queijo subiu 20%",
    message: "Tres pratos foram afetados. A Pizza mussarela perdeu R$ 1,60 de lucro por unidade.",
    impact: -412
  },
  {
    id: "alert-burger",
    severity: "warning",
    title: "Burger pode subir R$ 2,80",
    message: "O prato vende bem, mas esta abaixo da margem alvo.",
    impact: 504
  }
];

export const monthlySummary = {
  averageMargin: 0.234,
  totalProfit: 3263,
  lossItems: 1,
  healthyItems: 2,
  attentionItems: 1,
  menuScore: 72
};

export function currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  }).format(value);
}

export function percent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}
