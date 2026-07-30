import { Request, Response } from 'express';
import { UserTree, UserTreeDocument, TreeGrowthStage } from '../models/user-tree.model';

// ── Streak-based stage thresholds (days of consistent streak) ────────

const STREAK_THRESHOLDS: { stage: TreeGrowthStage; minStreak: number }[] = [
  { stage: 'mature', minStreak: 85 },
  { stage: 'fruiting', minStreak: 75 },
  { stage: 'blooming', minStreak: 65 },
  { stage: 'flowering', minStreak: 55 },
  { stage: 'growing', minStreak: 45 },
  { stage: 'sapling_2', minStreak: 35 },
  { stage: 'sapling_1', minStreak: 25 },
  { stage: 'sapling', minStreak: 15 },
  { stage: 'seedling', minStreak: 0 },
];

/** Points awarded per green/partial day for total score tracking. */
const POINTS_GREEN = 10;
const POINTS_PARTIAL = 3;

/** Health penalty per consecutive missed day. */
const PENALTY_PER_MISSED_DAY = 5;

/** Water bonus scaling based on consecutive success days. */
function getWaterBonus(consecutiveDays: number): number {
  if (consecutiveDays >= 3) return 1.0;
  if (consecutiveDays === 2) return 0.7;
  if (consecutiveDays === 1) return 0.5;
  return 0.3;
}

/** Derive growth stage from consecutive streak days. */
function deriveStageFromStreak(consecutiveDays: number): TreeGrowthStage {
  for (const item of STREAK_THRESHOLDS) {
    if (consecutiveDays >= item.minStreak) {
      return item.stage;
    }
  }
  return 'seedling';
}

/**
 * Apply missed-day penalties for all dates between lastWateredDate and today
 * that were not watered. Mutates the tree document but does NOT save it.
 */
function applyMissedDayPenalties(tree: UserTreeDocument, today: string): void {
  if (!tree.lastWateredDate) return;

  const last = new Date(tree.lastWateredDate + 'T12:00:00');
  const current = new Date(today + 'T12:00:00');
  const diffMs = current.getTime() - last.getTime();
  const missedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (missedDays <= 0) return; // already up to date or same day

  for (let i = 0; i < missedDays; i++) {
    tree.missedDaysInRow += 1;
    tree.consecutiveSuccessDays = 0; // missed day breaks streak!
    const penalty = tree.missedDaysInRow * PENALTY_PER_MISSED_DAY;
    tree.healthPercentage = Math.max(0, tree.healthPercentage - penalty);
  }
  tree.currentWaterBonus = getWaterBonus(0); // penalty resets bonus
}

// ── Helpers ──────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

async function findOrCreateTree(userId: string): Promise<UserTreeDocument> {
  let tree = await UserTree.findOne({ userId });
  if (!tree) {
    tree = await UserTree.create({ userId });
  }
  return tree;
}

// ── Controllers ──────────────────────────────────────────────────────

/** GET /tree — fetch or auto-create the user's tree, applying any penalties. */
export const getTreeStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub || req.user.userId || req.user.id;
    const today = getToday();

    const tree = await findOrCreateTree(userId);

    // Apply missed-day penalties since last watered date
    applyMissedDayPenalties(tree, today);

    // Sync stage based on streak days
    tree.growthStage = deriveStageFromStreak(tree.consecutiveSuccessDays);

    await tree.save();

    res.json(tree);
  } catch (err) {
    console.error('getTreeStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /tree/water — record today's watering.
 * Body: { goalsCompleted: number, totalGoals: number, dayStatus: 'green' | 'partial' | 'grey' }
 */
export const waterTree = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub || req.user.userId || req.user.id;
    const today = getToday();
    const { goalsCompleted = 0, totalGoals = 0, dayStatus = 'grey' } = req.body;

    const tree = await findOrCreateTree(userId);

    // Idempotent: one watering per day
    if (tree.lastWateredDate === today) {
      return res.status(400).json({ message: 'Already watered today.' });
    }

    // Apply missed-day penalties for skipped days before today
    applyMissedDayPenalties(tree, today);

    if (dayStatus === 'grey') {
      // No actual watering — just persist the penalty & reset streak
      tree.consecutiveSuccessDays = 0;
      tree.growthStage = deriveStageFromStreak(0);
      await tree.save();
      return res.json(tree);
    }

    // Green day extends streak; partial day keeps streak but gives less points
    if (dayStatus === 'green') {
      tree.consecutiveSuccessDays += 1;
    }

    tree.missedDaysInRow = 0;
    tree.currentWaterBonus = getWaterBonus(tree.consecutiveSuccessDays);

    // Health: green days restore health (+8), partial days (+2)
    const healthGain = dayStatus === 'green' ? 8 : 2;
    tree.healthPercentage = Math.min(100, tree.healthPercentage + healthGain);

    // Growth points
    const basePoints = dayStatus === 'green' ? POINTS_GREEN : POINTS_PARTIAL;
    const pointsEarned = Math.round(basePoints * tree.currentWaterBonus);
    tree.totalGrowthPoints += pointsEarned;

    // Growth stage is driven by consecutive success days!
    tree.growthStage = deriveStageFromStreak(tree.consecutiveSuccessDays);
    tree.lastWateredDate = today;

    // Append watering record (keep last 90 entries)
    tree.wateringHistory.push({ date: today, goalsCompleted, totalGoals });
    if (tree.wateringHistory.length > 90) {
      tree.wateringHistory = tree.wateringHistory.slice(-90);
    }

    await tree.save();

    res.json(tree);
  } catch (err) {
    console.error('waterTree error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/** PATCH /tree/name — rename the user's tree. Body: { name: string } */
export const setTreeName = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub || req.user.userId || req.user.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Tree name is required.' });
    }

    const trimmed = name.trim().slice(0, 30);
    const tree = await UserTree.findOneAndUpdate(
      { userId },
      { treeName: trimmed },
      { new: true, upsert: true }
    );

    res.json(tree);
  } catch (err) {
    console.error('setTreeName error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/** GET /tree/history — last 30 watering records. */
export const getTreeHistory = async (req: any, res: Response) => {
  try {
    const userId = req.user.sub || req.user.userId || req.user.id;
    const tree = await UserTree.findOne({ userId });
    if (!tree) return res.json([]);

    const history = [...tree.wateringHistory]
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 30);

    res.json(history);
  } catch (err) {
    console.error('getTreeHistory error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
