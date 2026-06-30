const mongoose = require('mongoose');

const mongoUri = "mongodb://nikeeparihar695_db_user:Dotivo%404725@ac-eojfa1r-shard-00-00.kyhszlc.mongodb.net:27017,ac-eojfa1r-shard-00-01.kyhszlc.mongodb.net:27017,ac-eojfa1r-shard-00-02.kyhszlc.mongodb.net:27017/dotivo?ssl=true&replicaSet=atlas-11tfkv-shard-0&authSource=admin&retryWrites=true&w=majority";
const userId = "6a3d02026f20ea46a646482a";

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB. Starting database repair for user:", userId);

    const db = mongoose.connection.db;
    
    // 1. Fetch all completions for this user
    const completions = await db.collection('goalcompletions')
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: 1 }) // process chronologically
      .toArray();

    console.log(`Found ${completions.length} completions to process.`);

    // Group completions by date and goalTemplateId to find the latest completedCount
    const latestCompletionsByDate = {};
    for (const c of completions) {
      if (!latestCompletionsByDate[c.date]) {
        latestCompletionsByDate[c.date] = {};
      }
      latestCompletionsByDate[c.date][c.goalTemplateId.toString()] = c.completedCount;
    }

    console.log("Latest completions by date parsed:", latestCompletionsByDate);

    // 2. Fetch all templates for this user to rebuild plans properly
    const templates = await db.collection('goaltemplates')
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .toArray();

    const templatesMap = {};
    for (const t of templates) {
      templatesMap[t._id.toString()] = t;
    }

    // 3. For each date with completions, repair the dailyplan and daystatus
    for (const date of Object.keys(latestCompletionsByDate)) {
      console.log(`Repairing date: ${date}`);
      const dayCompletions = latestCompletionsByDate[date];

      // Fetch or create daily plan
      let plan = await db.collection('dailyplans').findOne({
        userId: new mongoose.Types.ObjectId(userId),
        date
      });

      if (!plan) {
        console.log(`Creating missing DailyPlan for ${date}`);
        plan = {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(userId),
          date,
          goals: [],
          summaryStatus: 'grey',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Rebuild goals list based on active templates plus any completed templates
      const planGoalsMap = {};
      
      // Seed with whatever is currently in the plan
      for (const g of plan.goals || []) {
        planGoalsMap[g.goalTemplateId.toString()] = g;
      }

      // Add templates from completions if missing
      for (const templateId of Object.keys(dayCompletions)) {
        if (!planGoalsMap[templateId]) {
          const t = templatesMap[templateId];
          if (t) {
            planGoalsMap[templateId] = {
              goalTemplateId: t._id,
              title: t.title,
              category: t.category,
              targetCount: t.targetCount,
              completedCount: 0,
              isDailyMinimum: t.isDailyMinimum,
              isTop3Default: t.isTop3Default,
              color: t.color,
              icon: t.icon
            };
          } else {
            console.log(`Warning: Template ${templateId} not found in database. Creating placeholder.`);
            planGoalsMap[templateId] = {
              goalTemplateId: new mongoose.Types.ObjectId(templateId),
              title: "Deleted Goal",
              targetCount: 1,
              completedCount: 0,
              isDailyMinimum: false,
              isTop3Default: false
            };
          }
        }
      }

      // Update completedCount from completions
      for (const [templateId, count] of Object.entries(dayCompletions)) {
        planGoalsMap[templateId].completedCount = count;
      }

      plan.goals = Object.values(planGoalsMap);

      // Evaluate plan status
      let minimumsMet = true;
      let hasMinimums = false;
      let completedGoalsCount = 0;

      for (const g of plan.goals) {
        if (g.isDailyMinimum) {
          hasMinimums = true;
          if (g.completedCount < g.targetCount) minimumsMet = false;
        }
        if (g.completedCount >= g.targetCount) completedGoalsCount++;
      }

      let status = 'grey';
      if (hasMinimums && minimumsMet) status = 'green';
      else if (completedGoalsCount > 0) status = 'partial';

      plan.summaryStatus = status;
      plan.updatedAt = new Date();

      // Save plan back
      await db.collection('dailyplans').replaceOne(
        { _id: plan._id },
        plan,
        { upsert: true }
      );

      // Update DayStatus
      const completionScore = plan.goals.length > 0 ? completedGoalsCount / plan.goals.length : 0;
      await db.collection('daystatuses').updateOne(
        { userId: new mongoose.Types.ObjectId(userId), date },
        {
          $set: {
            status,
            dailyMinimumMet: minimumsMet,
            totalGoals: plan.goals.length,
            completedGoals: completedGoalsCount,
            completionScore,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      console.log(`Successfully repaired ${date}. Status: ${status}, Score: ${completionScore}`);
    }

    console.log("Database repair complete! Exiting.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error during database repair:", err);
    process.exit(1);
  });
