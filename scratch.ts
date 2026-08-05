import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const DayStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  status: { type: String, default: 'grey' },
});
const DayStatus = mongoose.model('DayStatus', DayStatusSchema);

const UserSchema = new mongoose.Schema({});
const User = mongoose.model('User', UserSchema);

const UserTreeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  consecutiveSuccessDays: { type: Number, default: 0 }
});
const UserTree = mongoose.model('UserTree', UserTreeSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const user = await User.findOne();
  if (!user) {
    console.log('No user found');
    process.exit(1);
  }

  // Upsert DayStatus for July 31st
  await DayStatus.updateOne(
    { userId: user._id as mongoose.Types.ObjectId, date: '2026-07-31' },
    { $set: { status: 'green', dailyMinimumMet: true, completedGoals: 1, totalGoals: 1 } },
    { upsert: true }
  );

  console.log('Added completed day for 2026-07-31');

  // Update consecutiveSuccessDays directly in UserTree so it instantly shows up as 1 streak
  // (if they haven't completed today yet)
  await UserTree.updateOne(
    { userId: user._id as mongoose.Types.ObjectId },
    { $set: { consecutiveSuccessDays: 1, lastWateredDate: '2026-07-31' } }
  );

  console.log('Updated UserTree streak to 1');

  process.exit(0);
}
run();
