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
    <div className="citizen-fade-in space-y-5 pb-4">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-xl font-bold text-white">♻️ Segregation Guide</h2>
        <p className="text-slate-400 text-sm mt-1">Learn to sort your waste — save Nagpur's future.</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
        {(['guide', 'quiz', 'tips'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              activeView === tab
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'guide' ? '📖 Guide' : tab === 'quiz' ? '🧠 Quiz' : '💡 Tips'}
          </button>
        ))}
      </div>

      {/* ========== GUIDE VIEW ========== */}
      {activeView === 'guide' && (
        <div className="space-y-4">
          {/* Split Infographic */}
          <div className="citizen-split-card">
            {/* Wet Side */}
            {wetCategory && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">🟢</div>
                  <div>
                    <div className="font-bold text-green-400 text-sm">Wet Waste</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Green Bin</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{wetCategory.description}</p>
                <div className="space-y-1.5">
                  {wetCategory.items.map(item => (
                    <div key={item.name} className="bg-green-500/5 border border-green-500/15 rounded-lg p-2.5 flex items-center gap-2.5 group citizen-card-lift">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-500 group-hover:text-green-400/70 transition-colors">{item.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dry Side */}
            {dryCategory && (
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🔵</div>
                  <div>
                    <div className="font-bold text-amber-400 text-sm">Dry Waste</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Blue Bin</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{dryCategory.description}</p>
                <div className="space-y-1.5">
                  {dryCategory.items.map(item => (
                    <div key={item.name} className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 flex items-center gap-2.5 group citizen-card-lift">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-500 group-hover:text-amber-400/70 transition-colors">{item.tip}</div>
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
        <div className="space-y-4">
          {quizDone ? (
            /* Quiz Complete */
            <div className="citizen-fade-in-scale bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
              <div className="text-5xl mb-2">
                {quizScore === data.quiz.length ? '🏆' : quizScore >= data.quiz.length / 2 ? '🎉' : '📚'}
              </div>
              <h3 className="text-xl font-extrabold text-white">Quiz Complete!</h3>
              <div className="text-3xl font-extrabold">
                <span className="text-emerald-400">{quizScore}</span>
                <span className="text-slate-500"> / {data.quiz.length}</span>
              </div>
              <p className="text-sm text-slate-400">
                {quizScore === data.quiz.length
                  ? 'Perfect score! You\'re a segregation expert! 🌟'
                  : quizScore >= data.quiz.length / 2
                    ? 'Good job! Keep learning to get even better!'
                    : 'Keep practicing — every bit of knowledge helps!'}
              </p>
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                <span>🌿</span> +{quizScore * 10} GreenPoints earned
              </div>
              <button
                onClick={restartQuiz}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Play Again
              </button>
            </div>
          ) : currentQuiz ? (
            /* Active Question */
            <div className="citizen-fade-in space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 citizen-progress-fill"
                    style={{ width: `${((quizIndex + 1) / data.quiz.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  {quizIndex + 1}/{data.quiz.length}
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Is this Wet or Dry waste?</div>
                <div className="text-2xl font-extrabold text-white mb-2">{currentQuiz.question}</div>
                <div className="text-4xl my-4">🤔</div>
              </div>

              {/* Answer Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuizAnswer('wet')}
                  disabled={quizAnswer !== null}
                  className={`
                    py-5 rounded-2xl font-bold text-lg transition-all border-2
                    ${quizAnswer === 'wet'
                      ? quizAnswer === currentQuiz.answer
                        ? 'bg-green-500/20 border-green-500 text-green-400 scale-105'
                        : 'bg-red-500/20 border-red-500 text-red-400 scale-95'
                      : quizAnswer && currentQuiz.answer === 'wet'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:scale-[1.03] active:scale-[0.97]'
                    }
                    ${quizAnswer !== null ? 'cursor-default' : ''}
                  `}
                >
                  🟢 Wet
                </button>
                <button
                  onClick={() => handleQuizAnswer('dry')}
                  disabled={quizAnswer !== null}
                  className={`
                    py-5 rounded-2xl font-bold text-lg transition-all border-2
                    ${quizAnswer === 'dry'
                      ? quizAnswer === currentQuiz.answer
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 scale-105'
                        : 'bg-red-500/20 border-red-500 text-red-400 scale-95'
                      : quizAnswer && currentQuiz.answer === 'dry'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:scale-[1.03] active:scale-[0.97]'
                    }
                    ${quizAnswer !== null ? 'cursor-default' : ''}
                  `}
                >
                  🔵 Dry
                </button>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className={`citizen-fade-in rounded-xl p-4 border ${
                  quizAnswer === currentQuiz.answer
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{quizAnswer === currentQuiz.answer ? '✅' : '❌'}</span>
                    <span className={`font-bold text-sm ${quizAnswer === currentQuiz.answer ? 'text-emerald-400' : 'text-red-400'}`}>
                      {quizAnswer === currentQuiz.answer ? 'Correct!' : 'Not quite!'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{currentQuiz.explanation}</p>
                </div>
              )}

              {/* Next button */}
              {quizAnswer && (
                <button
                  onClick={nextQuestion}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] citizen-fade-in"
                >
                  {quizIndex + 1 < data.quiz.length ? 'Next Question →' : 'See Results 🎉'}
                </button>
              )}

              {/* Score */}
              <div className="text-center text-xs text-slate-500">
                Score: <span className="text-emerald-400 font-bold">{quizScore}</span> / {quizIndex + (quizAnswer ? 1 : 0)}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========== TIPS VIEW ========== */}
      {activeView === 'tips' && (
        <div className="space-y-3 citizen-stagger">
          {data.tips.map((tip, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 flex items-start gap-3 citizen-card-lift"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center flex-shrink-0 text-sm font-bold text-sky-400">
                {i + 1}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
            </div>
          ))}

          {/* Environmental impact callout */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-sm font-semibold text-emerald-400 mb-1">Every Action Counts</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proper waste segregation can divert up to <strong className="text-white">60% of Nagpur's daily 1,200 tonnes</strong> from landfills to recycling centers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegregationGuide;
