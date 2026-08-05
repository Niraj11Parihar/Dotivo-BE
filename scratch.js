"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const DayStatusSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    status: { type: String, default: 'grey' },
});
const DayStatus = mongoose_1.default.model('DayStatus', DayStatusSchema);
const UserSchema = new mongoose_1.default.Schema({});
const User = mongoose_1.default.model('User', UserSchema);
const UserTreeSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    consecutiveSuccessDays: { type: Number, default: 0 }
});
const UserTree = mongoose_1.default.model('UserTree', UserTreeSchema);
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const user = await User.findOne();
    if (!user) {
        console.log('No user found');
        process.exit(1);
    }
    await DayStatus.updateOne({ userId: user._id, date: '2026-07-31' }, { $set: { status: 'green', dailyMinimumMet: true, completedGoals: 1, totalGoals: 1 } }, { upsert: true });
    console.log('Added completed day for 2026-07-31');
    await UserTree.updateOne({ userId: user._id }, { $set: { consecutiveSuccessDays: 1, lastWateredDate: '2026-07-31' } });
    console.log('Updated UserTree streak to 1');
    process.exit(0);
}
run();
//# sourceMappingURL=scratch.js.map