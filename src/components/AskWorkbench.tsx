import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  HelpCircle,
  History,
  Info,
  Search,
  XCircle,
} from 'lucide-react';
import {
  KnowledgeBase,
  PRESET_DOCUMENTS,
  QAResult,
  RULE_BASE,
  answerQuestionFinal,
  answerQuestionOriginal,
} from '../engine/attendanceQA';

export type EngineMode = 'final' | 'original' | 'compare';

interface AskWorkbenchProps {
  kb: KnowledgeBase;
  rawDocument: string;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenKnowledgeBase: () => void;
  question: string;
  onQuestionChange: (q: string) => void;
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;
}

const SAMPLE_QUESTIONS = [
  "Is Kiran's attendance eligible for exams?",
  'What percentage of days was Priya present?',
  'Which students have attendance shortage?',
  'What is the minimum required attendance?',
  'How many classes did Priya miss?',
  'Is Neha eligible?',
];

function StatusBadgeText({ status }: { status: QAResult['status'] }) {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Answer Derived
        </span>
      );
    case 'shortage':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Shortage Flagged
        </span>
      );
    case 'not_found':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Not Found in KB
        </span>
      );
    case 'fallback':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Clarification Prompt
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Record Guard Triggered
        </span>
      );
  }
}

export const AskWorkbench: React.FC<AskWorkbenchProps> = ({
  kb,
  rawDocument,
  activePresetId,
  onSelectPreset,
  onOpenKnowledgeBase,
  question,
  onQuestionChange,
  engineMode,
  onEngineModeChange,
}) => {
  const [submittedQuestion, setSubmittedQuestion] = useState<string>(
    question || "Is Kiran's attendance eligible for exams?"
  );
  const [history, setHistory] = useState<string[]>([
    "Is Kiran's attendance eligible for exams?",
    'What percentage of days was Priya present?',
    'Which students have attendance shortage?',
  ]);

  const finalResult = answerQuestionFinal(submittedQuestion, kb);
  const originalResult = answerQuestionOriginal(submittedQuestion, rawDocument);
  const primaryResult = engineMode === 'original' ? originalResult : finalResult;

  const minRequired = (() => {
    for (const [k, v] of Object.entries(kb.documentFacts)) {
      if (
        k.includes('minimum') ||
        k.includes('required') ||
        k.includes('threshold') ||
        k.includes('cutoff')
      ) {
        return v;
      }
    }
    return null;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = question.trim();
    if (!cleaned) return;
    setSubmittedQuestion(cleaned);
    setHistory((prev) => [cleaned, ...prev.filter((item) => item !== cleaned)].slice(0, 6));
  };

  const handlePickQuestion = (q: string) => {
    onQuestionChange(q);
    setSubmittedQuestion(q);
    setHistory((prev) => [q, ...prev.filter((item) => item !== q)].slice(0, 6));
  };

  const maxRuleScore = Math.max(
    1,
    ...finalResult.intentScores.map((s) => s.score)
  );

  return (
    <div className="space-y-8">
      {/* Intro + Engine Mode Control */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 pb-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Classical Symbolic AI · Zero NLP &amp; Zero RAG · Deterministic Rule Inference
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Student Attendance Questioning System
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Ask natural questions about present days, absent days, attendance percentage, exam eligibility, or class-wide shortages. Every answer is traced directly to matched keyword weights, the Knowledge Base, and IF–THEN rules.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <span className="text-xs font-medium text-slate-500">Inference Engine Mode</span>
          <div
            role="group"
            aria-label="Inference Engine Mode"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {(
              [
                { id: 'final', label: 'Final Engine' },
                { id: 'original', label: 'Original v1' },
                { id: 'compare', label: 'Compare Both' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onEngineModeChange(opt.id)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                  engineMode === opt.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main 2-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Primary Stage (7 cols on lg, 8 on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Question Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <label
                htmlFor="question-input"
                className="block text-sm font-semibold text-slate-800"
              >
                Ask a Question Against the Knowledge Base
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="question-input"
                    type="text"
                    value={question}
                    onChange={(e) => onQuestionChange(e.target.value)}
                    placeholder="e.g., Is Kiran's attendance eligible for exams?"
                    className="w-full min-h-[46px] pl-10 pr-4 py-2.5 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Ask System</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>

            {/* Quick Sample Queries */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-medium text-slate-500">Sample Questions</div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((sample) => {
                  const isActive = submittedQuestion === sample;
                  return (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handlePickQuestion(sample)}
                      className={`text-left text-xs px-3 py-2 min-h-[36px] rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {sample}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Answer Display Card(s) */}
          {engineMode === 'compare' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Final Engine Output */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-blue-700">
                    Final Corrected Engine
                  </span>
                  <StatusBadgeText status={finalResult.status} />
                </div>
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {finalResult.answer}
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1 font-mono tabular-nums">
                  <div>Intent: {finalResult.selectedIntentLabel}</div>
                  {finalResult.calculationTrace && (
                    <div className="text-slate-600 break-words">
                      Trace: {finalResult.calculationTrace}
                    </div>
                  )}
                </div>
              </div>

              {/* Original Engine Output */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">
                    Original Engine (v1 Baseline)
                  </span>
                  <StatusBadgeText status={originalResult.status} />
                </div>
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {originalResult.answer}
                </p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1 font-mono tabular-nums">
                  <div>Branch: {originalResult.selectedIntentLabel}</div>
                  {originalResult.calculationTrace && (
                    <div className="text-slate-600 break-words">
                      Trace: {originalResult.calculationTrace}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {primaryResult.engine === 'final' ? 'Final Engine Response' : 'Original v1 Response'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Intent: {primaryResult.selectedIntentLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {primaryResult.responseTimeMs.toFixed(3)} ms
                  </span>
                </div>
                <StatusBadgeText status={primaryResult.status} />
              </div>

              <div className="space-y-2">
                <p className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
                  {primaryResult.answer}
                </p>
                {primaryResult.calculationTrace && (
                  <p className="text-xs sm:text-sm font-mono tabular-nums text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 break-words">
                    {primaryResult.calculationTrace}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span>
                  Rule: <strong className="font-medium text-slate-700">{primaryResult.ruleApplied}</strong>
                </span>
                {primaryResult.detectedStudents.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Matched Student(s):{' '}
                      <strong className="font-medium text-slate-700">
                        {primaryResult.detectedStudents.join(', ')}
                      </strong>
                    </span>
                  </>
                )}
                {primaryResult.promotedToShortageList && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-blue-700 font-medium">
                      Promoted from Eligibility to Shortage List (no student named + list word)
                    </span>
                  </>
                )}
                {primaryResult.isTie && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-700 font-medium">
                      Score tie detected ({primaryResult.tiedIntents.join(' = ')})
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step-by-Step Classical AI Reasoning Trace (Final Engine) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Deterministic Reasoning Trace
                </h2>
                <p className="text-xs text-slate-500">
                  Step-by-step inspection of tokenization, whole-token student match, weighted rule scoring, and IF–THEN inference.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Query: &ldquo;{submittedQuestion}&rdquo;
              </span>
            </div>

            {/* Stage 01: Tokenization & Suffix Stripping */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">
                01. Tokenization, Stop-Word Removal &amp; Suffix Stripping
              </h3>
              {finalResult.tokens.length === 0 ? (
                <p className="text-xs text-slate-500">Enter a question above to inspect tokens.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4 font-medium">Token</th>
                        <th className="py-2 pr-4 font-medium">After Suffix Strip</th>
                        <th className="py-2 pr-4 font-medium">Classification</th>
                        <th className="py-2 font-medium">Rule Keyword Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finalResult.tokens.map((tok, idx) => (
                        <tr key={`${tok.raw}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 pr-4 font-mono text-slate-900">{tok.raw}</td>
                          <td className="py-2 pr-4 font-mono text-slate-600">
                            {tok.role === 'stopword' ? '— (removed)' : tok.stemmed}
                          </td>
                          <td className="py-2 pr-4">
                            {tok.role === 'student' && (
                              <span className="font-medium text-blue-700">Student Entity</span>
                            )}
                            {tok.role === 'keyword' && (
                              <span className="font-medium text-emerald-700">Rule Keyword</span>
                            )}
                            {tok.role === 'stopword' && (
                              <span className="text-slate-400">Stop Word</span>
                            )}
                            {tok.role === 'unmatched' && (
                              <span className="text-slate-500">Unmatched Token</span>
                            )}
                          </td>
                          <td className="py-2 font-mono tabular-nums text-slate-700">
                            {tok.matchedIntents.length > 0
                              ? tok.matchedIntents
                                  .map((m) => `${m.intent} (+${m.weight})`)
                                  .join(', ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stage 02: Weighted Intent Scoring */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  02. Weighted Intent Scoring (Threshold &ge; 2)
                </h3>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Winner: {finalResult.selectedIntentLabel}
                </span>
              </div>

              <div className="space-y-2.5">
                {finalResult.intentScores.map((item) => {
                  const isWinner = item.intent === finalResult.selectedIntent;
                  const suppressedShortage =
                    item.intent === 'shortage_list' &&
                    finalResult.detectedStudents.length > 0;
                  const pctWidth = Math.min(100, Math.round((item.score / maxRuleScore) * 100));

                  return (
                    <div
                      key={item.intent}
                      className={`p-3 rounded-lg border transition-colors ${
                        isWinner
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-slate-50/50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-semibold ${
                              isWinner ? 'text-blue-800' : 'text-slate-700'
                            }`}
                          >
                            {item.label}
                          </span>
                          {suppressedShortage && (
                            <span className="text-slate-400 truncate">
                              (ignored: student named)
                            </span>
                          )}
                          {item.matchedKeywords.length > 0 && (
                            <span className="font-mono text-slate-500 truncate">
                              {item.matchedKeywords
                                .map((k) => `${k.word}:${k.weight}`)
                                .join(' + ')}
                            </span>
                          )}
                        </div>
                        <span
                          className={`font-mono font-semibold tabular-nums shrink-0 ${
                            isWinner ? 'text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          {item.score} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            isWinner ? 'bg-blue-600' : 'bg-slate-400'
                          }`}
                          style={{ width: `${item.score > 0 ? Math.max(pctWidth, 6) : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Context Panel (5 cols on lg, 4 on xl) */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Active Knowledge Base Snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Active Knowledge Base
                </h2>
                <p className="text-xs text-slate-500 font-mono tabular-nums">
                  {kb.studentOrder.length} students · {Object.keys(kb.documentFacts).length} document fact
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Edit KB</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Dataset Preset Switcher */}
            <div className="space-y-1.5">
              <label
                htmlFor="preset-select"
                className="block text-xs font-medium text-slate-600"
              >
                Load Document Scenario
              </label>
              <select
                id="preset-select"
                value={activePresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
              >
                {PRESET_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.label}
                  </option>
                ))}
                {activePresetId === 'custom' && (
                  <option value="custom">Custom Uploaded / Edited Document</option>
                )}
              </select>
            </div>

            {/* Student Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-2 font-medium">Student</th>
                    <th className="py-2 px-2 font-medium text-right">Present</th>
                    <th className="py-2 px-2 font-medium text-right">Total</th>
                    <th className="py-2 pl-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {kb.studentOrder.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        No student records parsed. Edit the document to add students.
                      </td>
                    </tr>
                  ) : (
                    kb.studentOrder.map((key) => {
                      const st = kb.students[key];
                      const p = st.fields['present days'];
                      const t = st.fields['total working days'];
                      const pct = p !== undefined && t !== undefined && t > 0 ? (p / t) * 100 : null;
                      const isEligible =
                        pct !== null && minRequired !== null ? pct >= minRequired : null;

                      return (
                        <tr
                          key={key}
                          onClick={() => handlePickQuestion(`Is ${st.name} eligible?`)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                          title={`Click to query ${st.name}'s eligibility`}
                        >
                          <td className="py-2.5 pr-2 font-medium text-slate-900">
                            {st.name}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            {p !== undefined ? p : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            {t !== undefined ? t : '—'}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono">
                            {pct === null ? (
                              <span className="text-red-700 font-medium">Incomplete</span>
                            ) : isEligible === null ? (
                              <span className="text-slate-700">{pct.toFixed(0)}%</span>
                            ) : isEligible ? (
                              <span className="text-emerald-700 font-medium">
                                {pct.toFixed(0)}% Eligible
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                {pct.toFixed(0)}% Short
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Document-Level Facts */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">Document-Level Facts</div>
              {Object.keys(kb.documentFacts).length === 0 ? (
                <p className="text-xs text-slate-500">No document-level facts found.</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(kb.documentFacts).map(([factKey, val]) => (
                    <div
                      key={factKey}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/70"
                    >
                      <span className="capitalize text-slate-700">{factKey}</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900">
                        {val}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consistency Warnings (if any) */}
            {kb.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Document Warnings
                </div>
                <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
                  {kb.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Supported Question Intents Quick Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Supported Question Intents
            </div>
            <ul className="divide-y divide-slate-100 text-xs">
              {RULE_BASE.map((rule) => (
                <li key={rule.id} className="py-2 flex items-start justify-between gap-3">
                  <span className="font-medium text-slate-800 shrink-0">{rule.label}</span>
                  <span className="text-slate-500 text-right">{rule.ruleDescription}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Query History */}
          {history.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Recent Questions
              </div>
              <div className="space-y-1.5">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePickQuestion(item)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="truncate">{item}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
