import React, { useEffect, useState } from 'react';
import type { RewardProfile, LeaderboardEntry } from '../types/citizen.types';
import { fetchRewards, fetchLeaderboard } from '../api/citizenApi';

const TIER_CONFIG: Record<string, { icon: string; color: string; gradient: string }> = {
  Seed:     { icon: '🌰', color: 'text-amber-700',  gradient: 'from-amber-800 to-amber-600' },
  Seedling: { icon: '🌱', color: 'text-lime-500',   gradient: 'from-lime-600 to-emerald-500' },
  Sapling:  { icon: '🌿', color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-400' },
  Tree:     { icon: '🌳', color: 'text-green-400',   gradient: 'from-green-500 to-emerald-400' },
  Forest:   { icon: '🌲', color: 'text-emerald-300', gradient: 'from-emerald-400 to-cyan-400' },
};

const RewardsPanel: React.FC = () => {
  const [rewards, setRewards] = useState<RewardProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'redeem' | 'leaderboard'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [rew, lb] = await Promise.all([fetchRewards(), fetchLeaderboard()]);
        setRewards(rew);
        setLeaderboard(lb);
      } catch (err) {
        console.error('Rewards load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !rewards) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  const tierConf = TIER_CONFIG[rewards.tier] || TIER_CONFIG.Seed;
  const nextTierConf = TIER_CONFIG[rewards.next_tier] || TIER_CONFIG.Tree;

  // Circular progress ring
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (rewards.tier_progress / 100) * circumference;

  return (
    <div className="citizen-fade-in space-y-5 pb-4">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-white">🌿 GreenPoints</h2>
        <p className="text-slate-400 text-sm mt-1">Your eco rewards & community standing.</p>
      </div>

      {/* Hero Card — Points + Tier */}
      <div className="citizen-slide-up bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 citizen-shimmer opacity-30 rounded-3xl" />

        <div className="relative z-10 flex items-center gap-5">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg width="120" height="120" className="transform -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r={radius} fill="none"
                stroke="url(#tierGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="citizen-progress-fill"
              />
              <defs>
                <linearGradient id="tierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl">{tierConf.icon}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">{rewards.tier_progress}%</span>
            </div>
          </div>

          {/* Points + Tier Info */}
          <div className="flex-1 min-w-0">
            <div className="text-4xl font-extrabold text-white citizen-count-pulse">
              {rewards.total_points.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400 mt-1">GreenPoints</div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${tierConf.gradient} text-white`}>
                {tierConf.icon} {rewards.tier}
              </span>
              <span className="text-slate-600">→</span>
              <span className="text-xs text-slate-500">
                {nextTierConf.icon} {rewards.next_tier} ({rewards.points_to_next_tier} pts)
              </span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="relative z-10 mt-5 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="font-extrabold text-rose-400 text-lg">{rewards.streak_days}</span>
            <span className="text-sm text-slate-400 ml-1.5">day streak!</span>
          </div>
          <div className="ml-auto flex gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center
                  ${i < rewards.streak_days
                    ? 'bg-rose-500/30 text-rose-400'
                    : 'bg-slate-700/50 text-slate-600'}
                `}
              >
                {i < rewards.streak_days ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
        {(['overview', 'redeem', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'overview' ? '📊 History' : tab === 'redeem' ? '🎁 Redeem' : '🏆 Board'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-2 citizen-stagger citizen-scrollbar max-h-80 overflow-y-auto pr-1">
          {rewards.history.map(txn => (
            <div
              key={txn.id}
              className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3.5 flex items-center justify-between citizen-card-lift"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  +{txn.points}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{txn.action}</div>
                  <div className="text-xs text-slate-500">{txn.date}</div>
                </div>
              </div>
              <span className="text-emerald-400 text-xs font-bold">🌿 +{txn.points}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'redeem' && (
        <div className="grid grid-cols-2 gap-3 citizen-stagger">
          {rewards.redeemable.map((item, i) => {
            const canAfford = rewards.total_points >= item.cost;
            return (
              <div
                key={i}
                className={`
                  bg-slate-800/50 border rounded-2xl p-4 text-center transition-all citizen-card-lift
                  ${canAfford
                    ? 'border-emerald-500/30 hover:border-emerald-400/50'
                    : 'border-slate-700/40 opacity-60'
                  }
                `}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-white mb-1 leading-tight">{item.name}</div>
                <div className={`text-xs font-bold ${canAfford ? 'text-emerald-400' : 'text-slate-500'}`}>
                  🌿 {item.cost} pts
                </div>
                <button
                  disabled={!canAfford}
                  className={`
                    mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-all
                    ${canAfford
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-slate-700/30 text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                  {canAfford ? 'Redeem' : 'Need more pts'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-2 citizen-stagger">
          {leaderboard.map(entry => {
            const entryTier = TIER_CONFIG[entry.tier] || TIER_CONFIG.Seed;
            const rankIcons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
            return (
              <div
                key={entry.rank}
                className={`
                  rounded-xl p-3.5 flex items-center gap-3 border transition-all citizen-card-lift
                  ${entry.is_current_user
                    ? 'bg-sky-500/10 border-sky-500/30 ring-1 ring-sky-400/20'
                    : 'bg-slate-800/50 border-slate-700/40'
                  }
                `}
              >
                <div className="w-8 text-center text-lg font-extrabold">
                  {rankIcons[entry.rank] || <span className="text-slate-500 text-sm">#{entry.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${entry.is_current_user ? 'text-sky-400' : 'text-white'}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="text-[10px] text-sky-400/60 ml-1.5">(You)</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {entryTier.icon} {entry.tier}
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  {entry.points.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RewardsPanel;
