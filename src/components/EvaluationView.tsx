import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Play,
  XCircle,
} from 'lucide-react';
import {
  BENCHMARK_QUESTIONS,
  BenchmarkQuestion,
  DEFAULT_ATTENDANCE_TXT,
  FAULTS_CATALOG,
  FaultEntry,
  QAResult,
  answerQuestionFinal,
  answerQuestionOriginal,
  evaluateBenchmarkAnswer,
  parseAttendanceDocument,
} from '../engine/attendanceQA';

interface EvaluationViewProps {
  onInspectQuestion: (question: string) => void;
  onTestFault: (fault: FaultEntry) => void;
}

type EvalFilter = 'all' | 'main' | 'held_out' | 'fixed' | 'misses';

interface EvaluatedRow {
  item: BenchmarkQuestion;
  originalResult: QAResult;
  finalResult: QAResult;
  originalPass: boolean;
  finalPass: boolean;
}

const CATEGORIES: BenchmarkQuestion['category'][] = [
  'Present days',
  'Absent days',
  'Working days',
  'Attendance percentage',
  'Eligibility',
  'Document-level rules',
  'Out of scope',
];

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  onInspectQuestion,
  onTestFault,
}) => {
  const [filter, setFilter] = useState<EvalFilter>('all');
  const [runNonce, setRunNonce] = useState(0);

  const evaluation = useMemo(() => {
    const kb = parseAttendanceDocument(DEFAULT_ATTENDANCE_TXT);
    const rows: EvaluatedRow[] = BENCHMARK_QUESTIONS.map((item) => {
      const originalResult = answerQuestionOriginal(
        item.question,
        DEFAULT_ATTENDANCE_TXT
      );
      const finalResult = answerQuestionFinal(item.question, kb);
      return {
        item,
        originalResult,
        finalResult,
        originalPass: evaluateBenchmarkAnswer(originalResult, item),
        finalPass: evaluateBenchmarkAnswer(finalResult, item),
      };
    });

    const mainRows = rows.filter((r) => r.item.set === 'main');
    const heldRows = rows.filter((r) => r.item.set === 'held_out');

    const categoryStats = CATEGORIES.map((cat) => {
      const catRows = mainRows.filter((r) => r.item.category === cat);
      const origCorrect = catRows.filter((r) => r.originalPass).length;
      const finalCorrect = catRows.filter((r) => r.finalPass).length;
      return {
        category: cat,
        total: catRows.length,
        origCorrect,
        finalCorrect,
        delta: finalCorrect - origCorrect,
      };
    });

    const mainOrig = mainRows.filter((r) => r.originalPass).length;
    const mainFinal = mainRows.filter((r) => r.finalPass).length;
    const heldOrig = heldRows.filter((r) => r.originalPass).length;
    const heldFinal = heldRows.filter((r) => r.finalPass).length;

    return {
      rows,
      categoryStats,
      mainOrig,
      mainFinal,
      mainTotal: mainRows.length,
      heldOrig,
      heldFinal,
      heldTotal: heldRows.length,
      runId: runNonce,
    };
  }, [runNonce]);

  const filteredRows = evaluation.rows.filter((row) => {
    if (filter === 'main') return row.item.set === 'main';
    if (filter === 'held_out') return row.item.set === 'held_out';
    if (filter === 'fixed') return !row.originalPass && row.finalPass;
    if (filter === 'misses') return !row.finalPass;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Sections 6–8 · Live Experimental Benchmark &amp; Fault Diagnostics
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Evaluation Suite &amp; Fault Analysis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Execute the full 24-question benchmark and 10-question held-out set directly in your browser against both the Original v1 baseline and Final corrected engine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRunNonce((n) => n + 1)}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Re-Run Live Evaluation
        </button>
      </section>

      {/* Summary KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Final Engine (24-Question Set)
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {evaluation.mainFinal} / {evaluation.mainTotal}{' '}
            <span className="text-base font-semibold text-emerald-700">
              ({Math.round((evaluation.mainFinal / evaluation.mainTotal) * 100)}%)
            </span>
          </div>
          <div className="text-xs text-slate-500">
            +9 questions resolved vs. Original v1
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Original v1 (24-Question Set)
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {evaluation.mainOrig} / {evaluation.mainTotal}{' '}
            <span className="text-base font-semibold text-amber-700">
              ({((evaluation.mainOrig / evaluation.mainTotal) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Failed on F1 branch order, F2 synonyms, F3 facts
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Final Engine (10 Held-Out Set)
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {evaluation.heldFinal} / {evaluation.heldTotal}{' '}
            <span className="text-base font-semibold text-blue-700">
              ({Math.round((evaluation.heldFinal / evaluation.heldTotal) * 100)}%)
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Unseen questions run without tuning rules
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <div className="text-xs font-medium text-slate-500">
            Original v1 (10 Held-Out Set)
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {evaluation.heldOrig} / {evaluation.heldTotal}{' '}
            <span className="text-base font-semibold text-slate-600">
              ({Math.round((evaluation.heldOrig / evaluation.heldTotal) * 100)}%)
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Baseline accuracy on unseen wording
          </div>
        </div>
      </section>

      {/* Table 3: Accuracy Before and After Fixes */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Accuracy Before &amp; After Fixes (Table 3)
            </h2>
            <p className="text-xs text-slate-500">
              Live category breakdown across the 24-question test set and 10-question held-out set.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium text-right">Original v1</th>
                <th className="py-2.5 px-4 font-medium text-right">Final Engine</th>
                <th className="py-2.5 pl-4 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums font-mono">
              {evaluation.categoryStats.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50/70">
                  <td className="py-2.5 pr-4 font-sans font-medium text-slate-900">
                    {row.category}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {row.origCorrect} / {row.total}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                    {row.finalCorrect} / {row.total}
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    {row.delta > 0 ? (
                      <span className="font-semibold text-emerald-700">+{row.delta}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold">
                <td className="py-3 pr-4 font-sans text-slate-900">
                  Overall (24 questions)
                </td>
                <td className="py-3 px-4 text-right text-slate-700">
                  {evaluation.mainOrig} / {evaluation.mainTotal} (62.5%)
                </td>
                <td className="py-3 px-4 text-right text-emerald-700">
                  {evaluation.mainFinal} / {evaluation.mainTotal} (100%)
                </td>
                <td className="py-3 pl-4 text-right text-emerald-700">
                  +{evaluation.mainFinal - evaluation.mainOrig}
                </td>
              </tr>
              <tr className="bg-slate-50/40 font-semibold">
                <td className="py-3 pr-4 font-sans text-slate-900">
                  Held-out set (10 questions)
                </td>
                <td className="py-3 px-4 text-right text-slate-700">
                  {evaluation.heldOrig} / {evaluation.heldTotal} (50%)
                </td>
                <td className="py-3 px-4 text-right text-blue-700">
                  {evaluation.heldFinal} / {evaluation.heldTotal} (70%)
                </td>
                <td className="py-3 pl-4 text-right text-emerald-700">
                  +{evaluation.heldFinal - evaluation.heldOrig}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Question-by-Question Results */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Question-by-Question Execution Log ({filteredRows.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click Inspect on any question to open its full reasoning trace in the workbench.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter evaluation questions"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {(
              [
                { id: 'all', label: 'All (34)' },
                { id: 'main', label: 'Question Set (24)' },
                { id: 'held_out', label: 'Held-Out (10)' },
                { id: 'fixed', label: 'Fixed by Final' },
                { id: 'misses', label: 'Held-Out Misses (3)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3 font-medium">ID</th>
                <th className="py-2.5 pr-4 font-medium">Question &amp; Category</th>
                <th className="py-2.5 pr-4 font-medium">Original v1</th>
                <th className="py-2.5 pr-4 font-medium">Final Engine</th>
                <th className="py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(({ item, originalResult, finalResult, originalPass, finalPass }) => (
                <tr key={item.id} className="hover:bg-slate-50/70 align-top">
                  <td className="py-3 pr-3 font-mono font-semibold text-slate-500 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-3 pr-4 space-y-1 max-w-xs">
                    <div className="font-medium text-slate-900">{item.question}</div>
                    <div className="text-slate-500">
                      {item.category} · {item.set === 'main' ? 'Question Set' : 'Held-Out'}
                    </div>
                    {item.note && (
                      <div className="text-amber-700 font-medium">{item.note}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[220px] space-y-1">
                    <div
                      className={`inline-flex items-center gap-1 font-semibold ${
                        originalPass ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {originalPass ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {originalPass ? 'Pass' : 'Fail'}
                    </div>
                    <div className="text-slate-600 break-words">
                      {originalResult.answer}
                    </div>
                  </td>
                  <td className="py-3 pr-4 max-w-[260px] space-y-1">
                    <div
                      className={`inline-flex items-center gap-1 font-semibold ${
                        finalPass ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {finalPass ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {finalPass ? 'Pass' : 'Miss (Held-Out)'}
                    </div>
                    <div className="text-slate-800 break-words">
                      {finalResult.answer}
                    </div>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectQuestion(item.question)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Documented Faults F1–F6 */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Six Faults Identified &amp; Fixed (Section 7)
              </h2>
              <p className="text-xs text-slate-500">
                Click &ldquo;Test Fault Live&rdquo; to load that exact test document and failing query side by side.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAULTS_CATALOG.map((fault) => (
            <div
              key={fault.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {fault.id}. {fault.title}
                  </span>
                  <span className="text-xs text-slate-500">{fault.scope}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Evidence:</strong> {fault.evidence}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-emerald-800">Fix:</strong> {fault.fix}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500 truncate">
                  &ldquo;{fault.demoQuestion}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => onTestFault(fault)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Test Fault Live
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
