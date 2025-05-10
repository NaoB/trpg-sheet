'use server';

import { db } from '@/db';
import { statisticsTable, skillsTable, usersTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function updateStatistic(
  userId: string,
  statisticId: string,
  data: {
    level?: number;
    name?: string;
    shortName?: string;
    description?: string;
  }
) {
  try {
    const result = await db
      .update(statisticsTable)
      .set(data)
      .where(eq(statisticsTable.id, statisticId))
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error updating statistic:', error);
    return { success: false, error: 'Failed to update statistic' };
  }
}

export async function updateSkill(
  skillId: string,
  data: {
    level?: number;
    base?: number;
    bonus?: number;
    total?: number;
  }
) {
  try {
    const result = await db
      .update(skillsTable)
      .set(data)
      .where(eq(skillsTable.id, skillId))
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error updating skill:', error);
    return { success: false, error: 'Failed to update skill' };
  }
}

export async function getStatistics(userId: string) {
  try {
    const statistics = await db
      .select()
      .from(statisticsTable)
      .where(eq(statisticsTable.userId, userId));

    const statisticIds = statistics.map((stat) => stat.id);
    
    const skills = await db
      .select()
      .from(skillsTable)
      .where(inArray(skillsTable.statisticId, statisticIds));

    // Combine statistics with their skills
    const statisticsWithSkills = statistics.map((stat) => ({
      ...stat,
      skills: skills.filter((skill) => skill.statisticId === stat.id),
    }));

    return { success: true, data: statisticsWithSkills };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

export async function initializeStatistics(userId: string) {
  try {
    // First, check if user already has statistics
    const existingStats = await db
      .select()
      .from(statisticsTable)
      .where(eq(statisticsTable.userId, userId));

    if (existingStats.length > 0) {
      return { success: false, error: 'Statistics already exist for this user' };
    }

    // Helper function to generate slug
    const generateSlug = (name: string) => {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    // Create statistics with their skills
    const statistics = [
      {
        name: "Intelligence",
        shortName: "INT",
        description: "For solving puzzles, performing science, deduction, and the like.",
        level: 0,
        skills: [
          { name: "Awareness", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Business", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Deduction", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Education", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Language", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Monster Lore", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Social Etiquette", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Streetwise", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Tactics", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Teaching", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Wilderness Survival", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Reflexes",
        shortName: "REF",
        description: "For fighting, dodging, and tasks that require fast reactions and accurate movements.",
        level: 0,
        skills: [
          { name: "Brawling", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Dodge/Escape", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Melee", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Riding", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Sailing", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Small Blades", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Staff/Spear", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Swordsmanship", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Dexterity",
        shortName: "DEX",
        description: "For ranged attacks and anything that requires hand-eye coordination or balance.",
        level: 0,
        skills: [
          { name: "Archery", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Athletics", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Crossbow", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Sleight of Hand", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Stealth", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Body",
        shortName: "BODY",
        description: "For things that require great strength, like wrestling and strength feats, or physical endurance, such as resisting disease or fatigue.",
        level: 0,
        skills: [
          { name: "Physique", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Endurance", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Empathy",
        shortName: "EMP",
        description: "For affairs of the heart and emotions. Seducing and persuading come under this category.",
        level: 0,
        skills: [
          { name: "Charisma", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Deceit", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Fine Arts", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Gambling", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Grooming and Style", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Human Perception", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Leadership", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Persuasion", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Performance", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Seduction", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Craft",
        shortName: "CRA",
        description: "For using machinery and creating things with precision. Also for using artillery and setting traps.",
        level: 0,
        skills: [
          { name: "Alchemy", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Crafting", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Disguise", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "First Aid", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Forgery", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Pick Lock", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Trap Crafting", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Will",
        shortName: "WILL",
        description: "For intimidation, magical checks, and mental endurance checks. Shows your sheer power to keep moving forward and your ability to control magic.",
        level: 0,
        skills: [
          { name: "Courage", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Hex Weaving", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Intimidation", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Spell Casting", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Resist Magic", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Resist Coercion", costPerLevel: 1, level: 0, base: 0, bonus: 0, total: 0 },
          { name: "Ritual Crafting", costPerLevel: 2, level: 0, base: 0, bonus: 0, total: 0 },
        ],
      },
      {
        name: "Speed",
        shortName: "SPD",
        description: "This represents how fast your character moves. You can use this Stat when trying to outrun other people or determining how far you can move in a given time.",
        level: 0,
        skills: [],
      },
      {
        name: "Luck",
        shortName: "LUCK",
        description: "Luck is a pool of points used to change things in your favor. Before you make any skill roll, on your turn or in defense against someone else, you can add Luck. For every point you use you gain +1, but you must choose how many points you use before you roll. Your Luck pool refills at the beginning of each session.",
        level: 0,
        skills: [],
      },
    ];

    // Insert statistics and their skills
    for (const stat of statistics) {
      const statId = uuidv4();
      const statSlug = generateSlug(stat.name);
      
      await db.insert(statisticsTable).values({
        id: statId,
        userId,
        name: stat.name,
        shortName: stat.shortName,
        description: stat.description,
        level: stat.level,
        slug: statSlug,
      });

      // Insert skills for this statistic
      for (const skill of stat.skills) {
        const skillSlug = generateSlug(skill.name);
        await db.insert(skillsTable).values({
          id: uuidv4(),
          statisticId: statId,
          name: skill.name,
          costPerLevel: skill.costPerLevel,
          level: skill.level,
          base: skill.base,
          bonus: skill.bonus,
          total: skill.total,
          slug: skillSlug,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing statistics:', error);
    return { success: false, error: 'Failed to initialize statistics' };
  }
}

export async function createUser(data: { name: string; email: string }) {
  try {
    const userId = uuidv4();
    await db.insert(usersTable).values({
      id: userId,
      name: data.name,
      email: data.email,
    });

    // Initialize statistics for the new user
    await initializeStatistics(userId);

    return { success: true, userId };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function getUser(userId: string) {
  try {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function updateUserXp(userId: string, xp: number) {
  try {
    const result = await db
      .update(usersTable)
      .set({ xp })
      .where(eq(usersTable.id, userId))
      .returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error updating user XP:', error);
    return { success: false, error: 'Failed to update user XP' };
  }
}

export async function resetAllSkills(userId: string) {
  try {
    // Get all statistics for the user
    const statistics = await db
      .select()
      .from(statisticsTable)
      .where(eq(statisticsTable.userId, userId));

    const statisticIds = statistics.map((stat) => stat.id);

    // Reset all skills to level 0 in a single update
    const result = await db
      .update(skillsTable)
      .set({ level: 0 })
      .where(inArray(skillsTable.statisticId, statisticIds))
      .returning();

    return { success: true, data: result };
  } catch (error) {
    console.error('Error resetting skills:', error);
    return { success: false, error: 'Failed to reset skills' };
  }
}

export async function createStatistic(userId: string, data: { name: string; shortName: string; description: string }) {
  try {
    const statId = uuidv4();
    const statSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const result = await db.insert(statisticsTable).values({
      id: statId,
      userId,
      name: data.name,
      shortName: data.shortName,
      description: data.description,
      level: 0,
      slug: statSlug,
    }).returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error creating statistic:', error);
    return { success: false, error: 'Failed to create statistic' };
  }
}

export async function createSkill(statisticId: string, data: { name: string; costPerLevel: number }) {
  try {
    const skillId = uuidv4();
    const skillSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const result = await db.insert(skillsTable).values({
      id: skillId,
      statisticId,
      name: data.name,
      costPerLevel: data.costPerLevel,
      level: 0,
      base: 0,
      bonus: 0,
      total: 0,
      slug: skillSlug,
    }).returning();

    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error creating skill:', error);
    return { success: false, error: 'Failed to create skill' };
  }
} 