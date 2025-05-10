export interface Skills {
  id: string;
  statisticId: string;
  name: string;
  costPerLevel: number;
  level: number;
  base: number;
  bonus: number;
  total: number;
  slug: string;
}

export interface Statistic {
  id: string;
  userId: string;
  name: string;
  shortName: string;
  description: string;
  level: number;
  skills: Skills[];
  slug: string;
}