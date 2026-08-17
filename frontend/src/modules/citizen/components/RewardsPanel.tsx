import React, { useEffect, useState } from 'react';
import type { RewardProfile, LeaderboardEntry, RedeemableReward } from '../types/citizen.types';
import { fetchRewards, fetchLeaderboard } from '../api/citizenApi';

const TIER_CONFIG: Record<string, { icon: string; color: string; gradient: string }> = {
  Seed:     { icon: '🌰', color: 'text-amber-700',  gradient: 'from-amber-800 to-amber-600' },
  Seedling: { icon: '🌱', color: 'text-lime-500',   gradient: 'from-lime-600 to-emerald-500' },
  Sapling:  { icon: '🌿', color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-400' },
  Tree:     { icon: '🌳', color: 'text-green-400',   gradient: 'from-green-500 to-emerald-400' },
  Forest:   { icon: '🌲', color: 'text-emerald-300', gradient: 'from-emerald-400 to-cyan-400' },
};

interface WardRanking {
  rank: number;
  wardName: string;
  segregationRate: number;
  activeCitizens: number;
  isCurrentWard: boolean;
}

const NAGPUR_WARDS: WardRanking[] = [
  { rank: 1, wardName: 'Laxmi Nagar Zone', segregationRate: 88, activeCitizens: 4210, isCurrentWard: false },
  { rank: 2, wardName: 'Dharampeth Zone (Ward 14)', segregationRate: 84, activeCitizens: 3890, isCurrentWard: true },
  { rank: 3, wardName: 'Hanuman Nagar Zone', segregationRate: 79, activeCitizens: 3120, isCurrentWard: false },
  { rank: 4, wardName: 'Sitabuldi Zone', segregationRate: 75, activeCitizens: 2980, isCurrentWard: false },
  { rank: 5, wardName: 'Mangalwari Zone', segregationRate: 71, activeCitizens: 2450, isCurrentWard: false },
  { rank: 6, wardName: 'Nehru Nagar Zone', segregationRate: 68, activeCitizens: 2100, isCurrentWard: false },
  { rank: 7, wardName: 'Satranjipura Zone', segregationRate: 64, activeCitizens: 1850, isCurrentWard: false },
];

const RewardsPanel: React.FC = () => {
  const [rewards, setRewards] = useState<RewardProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'redeem' | 'leaderboard' | 'wardRankings'>('overview');

  // Voucher modal state
  const [selectedVoucher, setSelectedVoucher] = useState<RedeemableReward | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

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

  const handleRedeem = (item: RedeemableReward) => {
    if (!rewards || rewards.total_points < item.cost) return;

    // Deduct points locally for real-time responsiveness
    setRewards({
      ...rewards,
      total_points: rewards.total_points - item.cost,
      history: [
        {
          id: `txn-${Date.now().toString().slice(-4)}`,
          action: `Redeemed: ${item.name}`,
          points: -item.cost,
          date: new Date().toISOString().split('T')[0],
        },
        ...rewards.history,
      ],
    });

    const code = `NMC-${item.name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setRedeemedCode(code);
    setSelectedVoucher(item);
  };

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
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">🌿 GreenPoints &amp; Gamification</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Earn points for waste reports &amp; segregation. Redeem vouchers or check the civic leaderboard.</p>
      </div>

      {/* Hero Card - Points + Tier */}
      <div className="citizen-slide-up bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 citizen-shimmer opacity-30 rounded-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="relative flex-shrink-0">
              <svg width="130" height="130" className="transform -rotate-90">
                <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="9" />
                <circle
                  cx="65" cy="65" r={radius} fill="none"
                  stroke="url(#tierGradient)"
                  strokeWidth="9"
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
                <span className="text-4xl">{tierConf.icon}</span>
                <span className="text-xs font-bold text-slate-400 mt-0.5">{rewards.tier_progress}%</span>
              </div>
            </div>

            {/* Points + Tier Info */}
            <div>
              <div className="text-4xl md:text-5xl font-bold text-slate-100 citizen-count-pulse tracking-tight">
                {rewards.total_points.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400 mt-1 font-medium">Total Earned GreenPoints</div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full bg-gradient-to-r ${tierConf.gradient} text-white shadow-md`}>
                  {tierConf.icon} {rewards.tier} Tier
                </span>
                <span className="text-slate-600">→</span>
                <span className="text-xs text-slate-400 font-medium">
                  Next: {nextTierConf.icon} <strong className="text-slate-200">{rewards.next_tier}</strong> ({rewards.points_to_next_tier} pts remaining)
                </span>
              </div>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex-shrink-0 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <div className="font-bold text-rose-300 text-2xl">{rewards.streak_days} Day Streak</div>
                <div className="text-xs text-slate-400">Keep reporting waste to retain bonus</div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5 justify-between">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center
                    ${i < rewards.streak_days
                      ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-600 border border-slate-700/50'}
                  `}
                >
                  {i < rewards.streak_days ? 'o' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-lg">
        {(['overview', 'redeem', 'leaderboard', 'wardRankings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all capitalize ${
              activeTab === tab
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'overview' ? '📊 History' : tab === 'redeem' ? '🎁 Redeem' : tab === 'leaderboard' ? '🏆 Citizens' : '🏙️ Ward Ranks'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-3 citizen-stagger">
          {rewards.history.map(txn => (
            <div
              key={txn.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between citizen-card-lift"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${
                  txn.points > 0
                    ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                }`}>
                  {txn.points > 0 ? `+${txn.points}` : txn.points}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{txn.action}</div>
                  <div className="text-xs text-slate-500">{txn.date}</div>
                </div>
              </div>
              <span className={`text-sm font-extrabold ${txn.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {txn.points > 0 ? `🌿 +${txn.points}` : `${txn.points}`} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'redeem' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 citizen-stagger">
          {rewards.redeemable.map((item, i) => {
            const canAfford = rewards.total_points >= item.cost;
            return (
              <div
                key={i}
                className={`
                  bg-slate-900/60 border rounded-3xl p-5 text-center transition-all citizen-card-lift flex flex-col justify-between
                  ${canAfford
                    ? 'border-emerald-500/30 hover:border-emerald-400/50'
                    : 'border-slate-800 opacity-60'
                  }
                `}
              >
                <div>
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-base font-bold text-white mb-1.5 leading-tight">{item.name}</div>
                  <div className={`text-xs font-extrabold ${canAfford ? 'text-emerald-400' : 'text-slate-500'}`}>
                    🌿 {item.cost} GreenPoints
                  </div>
                </div>
                <button
                  onClick={() => handleRedeem(item)}
                  disabled={!canAfford}
                  className={`
                    mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all
                    ${canAfford
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-md'
                      : 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                    }
                  `}
                >
                  {canAfford ? 'Redeem Voucher' : 'Insufficient Points'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-3 max-w-3xl citizen-stagger">
          {leaderboard.map(entry => {
            const entryTier = TIER_CONFIG[entry.tier] || TIER_CONFIG.Seed;
            const rankIcons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
            return (
              <div
                key={entry.rank}
                className={`
                  rounded-2xl p-4 flex items-center gap-4 border transition-all citizen-card-lift
                  ${entry.is_current_user
                    ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-400/30'
                    : 'bg-slate-900/60 border-slate-800'
                  }
                `}
              >
                <div className="w-10 text-center text-xl font-extrabold">
                  {rankIcons[entry.rank] || <span className="text-slate-500 text-base">#{entry.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-base font-bold ${entry.is_current_user ? 'text-sky-400' : 'text-white'}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="text-xs text-sky-400/70 ml-2 font-normal">(You)</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {entryTier.icon} {entry.tier} Tier
                  </div>
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  {entry.points.toLocaleString()} pts
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ward Rankings Tab */}
      {activeTab === 'wardRankings' && (
        <div className="space-y-4 max-w-3xl citizen-stagger">
          <div className="bg-gradient-to-r from-sky-500/10 to-emerald-500/10 border border-sky-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-sky-400 font-bold uppercase tracking-wider">Inter-Ward Civic Competition</div>
              <div className="text-sm font-bold text-white mt-0.5">Nagpur City Municipal Ward Standings</div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Updated Live
            </span>
          </div>

          {NAGPUR_WARDS.map(w => (
            <div
              key={w.rank}
              className={`
                rounded-2xl p-4 border transition-all citizen-card-lift
                ${w.isCurrentWard
                  ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-400/30'
                  : 'bg-slate-900/60 border-slate-800'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-400">#{w.rank}</span>
                  <span className={`font-bold text-base ${w.isCurrentWard ? 'text-sky-400' : 'text-white'}`}>
                    {w.wardName}
                    {w.isCurrentWard && <span className="text-xs text-sky-400/70 ml-2 font-normal">(Your Ward)</span>}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-emerald-400">{w.segregationRate}% Compliance</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${w.segregationRate}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-slate-500 mt-1">
                {w.activeCitizens.toLocaleString()} Active Citizens Reporting
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Voucher Modal */}
      {selectedVoucher && redeemedCode && (
        <div className="citizen-fade-in-scale fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="citizen-modal-backdrop fixed inset-0" onClick={() => setSelectedVoucher(null)} />
          <div className="relative z-50 bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
            <div className="text-5xl">{selectedVoucher.icon}</div>
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">NMC Digital Voucher Claimed!</div>
              <h3 className="text-xl font-extrabold text-white mt-1">{selectedVoucher.name}</h3>
            </div>

            {/* Generated QR Code Box */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              <svg width="140" height="140" viewBox="0 0 100 100" className="mx-auto">
                <rect width="100" height="100" fill="#ffffff" />
                {/* QR Pattern Blocks */}
                <rect x="10" y="10" width="30" height="30" fill="#0f172a" />
                <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                <rect x="20" y="20" width="10" height="10" fill="#0f172a" />

                <rect x="60" y="10" width="30" height="30" fill="#0f172a" />
                <rect x="65" y="15" width="20" height="20" fill="#ffffff" />
                <rect x="70" y="20" width="10" height="10" fill="#0f172a" />

                <rect x="10" y="60" width="30" height="30" fill="#0f172a" />
                <rect x="15" y="65" width="20" height="20" fill="#ffffff" />
                <rect x="20" y="70" width="10" height="10" fill="#0f172a" />

                <rect x="50" y="50" width="15" height="15" fill="#0f172a" />
                <rect x="70" y="60" width="15" height="20" fill="#0f172a" />
                <rect x="50" y="75" width="20" height="15" fill="#0f172a" />
              </svg>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Voucher Coupon Code</div>
              <div className="text-lg font-mono font-black text-sky-400">{redeemedCode}</div>
              <div className="text-[10px] text-slate-500 mt-1">Valid at all NMC counters till 31 Dec 2026</div>
            </div>

            <button
              onClick={() => setSelectedVoucher(null)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Done / Save Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPanel;
