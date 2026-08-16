import React, { useEffect, useState, useCallback } from 'react';
import type { SegregationData, QuizQuestion } from '../types/citizen.types';
import { fetchSegregationGuide } from '../api/citizenApi';

const SegregationGuide: React.FC = () => {
  const [data, setData] = useState<SegregationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'guide' | 'quiz' | 'tips'>('guide');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<'wet' | 'dry' | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const guide = await fetchSegregationGuide();
        setData(guide);
      } catch (err) {
        console.error('Guide load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentQuiz: QuizQuestion | null = data?.quiz[quizIndex] ?? null;

  const handleQuizAnswer = useCallback((answer: 'wet' | 'dry') => {
    if (!currentQuiz || quizAnswer) return;
    setQuizAnswer(answer);
    setShowExplanation(true);
    if (answer === currentQuiz.answer) {
      setQuizScore(s => s + 1);
    }
  }, [currentQuiz, quizAnswer]);

  const nextQuestion = useCallback(() => {
    if (!data) return;
    if (quizIndex + 1 >= data.quiz.length) {
      setQuizDone(true);
    } else {
      setQuizIndex(i => i + 1);
      setQuizAnswer(null);
      setShowExplanation(false);
    }
  }, [data, quizIndex]);

  const restartQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizDone(false);
    setShowExplanation(false);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  const wetCategory = data.categories.find(c => c.category === 'Wet Waste');
  const dryCategory = data.categories.find(c => c.category === 'Dry Waste');

  return (
    <div className="citizen-fade-in space-y-6 max-w-6xl mx-auto pb-6">
      <div>
        <h2 className="text-2xl font-bold text-white">♻️ Waste Segregation Guide &amp; Quiz</h2>
        <p className="text-slate-400 text-sm mt-1">Proper segregation ensures effective municipal recycling across Nagpur.</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        {(['guide', 'quiz', 'tips'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all capitalize ${
              activeView === tab
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'guide' ? '📖 Visual Guide' : tab === 'quiz' ? '🧠 Segregation Quiz' : '💡 Pro Tips'}
          </button>
        ))}
      </div>

      {/* ========== GUIDE VIEW ========== */}
      {activeView === 'guide' && (
        <div className="space-y-6">
          {/* Split Infographic */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Wet Side */}
            {wetCategory && (
              <div className="bg-gradient-to-br from-green-500/10 via-emerald-600/5 to-slate-900 border border-green-500/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xl">🟢</div>
                  <div>
                    <h3 className="font-extrabold text-green-400 text-lg">Wet Waste (Biodegradable)</h3>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Dispose in Green Bin</div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{wetCategory.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {wetCategory.items.map(item => (
                    <div key={item.name} className="bg-slate-950/60 border border-green-500/20 rounded-2xl p-3.5 flex items-center gap-3 group citizen-card-lift">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400 group-hover:text-green-300 transition-colors">{item.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dry Side */}
            {dryCategory && (
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-600/5 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">🔵</div>
                  <div>
                    <h3 className="font-extrabold text-amber-400 text-lg">Dry Waste (Recyclable)</h3>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Dispose in Blue Bin</div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{dryCategory.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {dryCategory.items.map(item => (
                    <div key={item.name} className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-3.5 flex items-center gap-3 group citizen-card-lift">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400 group-hover:text-amber-300 transition-colors">{item.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== QUIZ VIEW ========== */}
      {activeView === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {quizDone ? (
            <div className="citizen-fade-in-scale bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 md:p-10 text-center space-y-4 shadow-2xl">
              <div className="text-6xl mb-2">
                {quizScore === data.quiz.length ? '🏆' : quizScore >= data.quiz.length / 2 ? '🎉' : '📚'}
              </div>
              <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
              <div className="text-4xl font-black">
                <span className="text-emerald-400">{quizScore}</span>
                <span className="text-slate-600"> / {data.quiz.length}</span>
              </div>
              <p className="text-sm text-slate-300">
                {quizScore === data.quiz.length
                  ? 'Flawless performance! You are a certified Nagpur Eco-Champion! 🌟'
                  : quizScore >= data.quiz.length / 2
                    ? 'Great effort! Your segregation knowledge helps keep Nagpur clean!'
                    : 'Good attempt! Review the visual guide and try again!'}
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-base font-extrabold">
                <span>🌿</span> +{quizScore * 10} GreenPoints earned
              </div>
              <button
                onClick={restartQuiz}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Play Again
              </button>
            </div>
          ) : currentQuiz ? (
            <div className="citizen-fade-in space-y-5">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 citizen-progress-fill"
                    style={{ width: `${((quizIndex + 1) / data.quiz.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  {quizIndex + 1}/{data.quiz.length}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center shadow-xl">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Which bin does this item belong to?</div>
                <div className="text-3xl font-black text-white mb-2">{currentQuiz.question}</div>
                <div className="text-5xl my-4">🤔</div>
              </div>

              {/* Answer Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleQuizAnswer('wet')}
                  disabled={quizAnswer !== null}
                  className={`
                    py-6 rounded-2xl font-extrabold text-xl transition-all border-2 flex items-center justify-center gap-3
                    ${quizAnswer === 'wet'
                      ? quizAnswer === currentQuiz.answer
                        ? 'bg-green-500/20 border-green-400 text-green-400 scale-105 shadow-lg shadow-green-500/20'
                        : 'bg-red-500/20 border-red-500 text-red-400 scale-95'
                      : quizAnswer && currentQuiz.answer === 'wet'
                        ? 'bg-green-500/20 border-green-400 text-green-400'
                        : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:scale-[1.03] active:scale-[0.97]'
                    }
                    ${quizAnswer !== null ? 'cursor-default' : ''}
                  `}
                >
                  🟢 Wet Waste
                </button>
                <button
                  onClick={() => handleQuizAnswer('dry')}
                  disabled={quizAnswer !== null}
                  className={`
                    py-6 rounded-2xl font-extrabold text-xl transition-all border-2 flex items-center justify-center gap-3
                    ${quizAnswer === 'dry'
                      ? quizAnswer === currentQuiz.answer
                        ? 'bg-amber-500/20 border-amber-400 text-amber-400 scale-105 shadow-lg shadow-amber-500/20'
                        : 'bg-red-500/20 border-red-500 text-red-400 scale-95'
                      : quizAnswer && currentQuiz.answer === 'dry'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:scale-[1.03] active:scale-[0.97]'
                    }
                    ${quizAnswer !== null ? 'cursor-default' : ''}
                  `}
                >
                  🔵 Dry Waste
                </button>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className={`citizen-fade-in rounded-2xl p-5 border ${
                  quizAnswer === currentQuiz.answer
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{quizAnswer === currentQuiz.answer ? '✅' : '❌'}</span>
                    <span className={`font-extrabold text-base ${quizAnswer === currentQuiz.answer ? 'text-emerald-400' : 'text-red-400'}`}>
                      {quizAnswer === currentQuiz.answer ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{currentQuiz.explanation}</p>
                </div>
              )}

              {/* Next button */}
              {quizAnswer && (
                <button
                  onClick={nextQuestion}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-black text-base rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] citizen-fade-in shadow-lg"
                >
                  {quizIndex + 1 < data.quiz.length ? 'Next Question →' : 'View Results 🎉'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ========== TIPS VIEW ========== */}
      {activeView === 'tips' && (
        <div className="grid md:grid-cols-2 gap-4 citizen-stagger">
          {data.tips.map((tip, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 citizen-card-lift"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-sky-400">
                {i + 1}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
            </div>
          ))}

          {/* Callout Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <h4 className="text-base font-extrabold text-emerald-400 mb-1">Impact of Segregation</h4>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              Nagpur generates over <strong className="text-white">1,200 tonnes of waste every day</strong>. By segregating wet and dry waste at home, we divert 60% of garbage away from landfills into composting and recycling streams.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegregationGuide;
