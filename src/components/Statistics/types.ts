export type Statistic = {
    name: string;
    shortName: string;
    description: string;
    level: number;
    skills: Skills[];
  }
  
export type Skills = {
    name: string;
    costPerLevel: number;
    level: number;
    base: number;
    bonus: number;
    total: number;
  };