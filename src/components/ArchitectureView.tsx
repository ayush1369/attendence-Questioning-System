import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  HelpCircle,
  Search,
  Settings2,
  XCircle,
} from 'lucide-react';
import { RULE_BASE } from '../engine/attendanceQA';

interface ArchitectureViewProps {
  onTryQuestion: (question: string) => void;
}

interface PipelineStage {
  id: string;
  phase: 'Start-Up Pipeline' | 'Per-Question Pipeline';
  stepNumber: string;
  title: string;
  subtitle: string;
  input: string;
  operation: string;
  output: string;
  justification: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'doc',
    phase: 'Start-Up Pipeline',
    stepNumber: '01',
    title: 'Attendance Document & Processing',
    subtitle: 'Read & parse attendance.txt',
    input: 'Plain-text file (attendance.txt) with Student: and Field: value lines.',
    operation:
      'Reads line by line, splits each line at the first colon, lower-cases field names, and parses numeric values.',
    output: 'Normalized field-value pairs grouped into candidate blocks.',
    justification:
      'Plain text line parsing requires zero external libraries or learned tokenizers.',
    icon: FileText,
  },
  {
    id: 'kb',
    phase: 'Start-Up Pipeline',
    stepNumber: '02',
    title: 'Extraction & Knowledge Base',
    subtitle: 'Frames & document-level facts',
    input: 'Normalized field-value blocks from the document loader.',
    operation:
      'Separates shared student record fields (Working, Present, Absent) from document-level policies (Minimum Required Attendance).',
    output: 'Structured dictionary Knowledge Base of student frames + document facts.',
    justification:
      'Frame-like records fit structured attendance data where every student shares identical slots.',
    icon: Database,
  },
  {
    id: 'qproc',
    phase: 'Per-Question Pipeline',
    stepNumber: '03',
    title: 'Question Processing',
    subtitle: 'Tokenize, detect name, strip suffixes',
    input: 'Natural-language user question string.',
    operation:
      'Lower-cases text, splits into alphanumeric tokens, matches whole-token student names, removes stop words, and strips plural/-ing/-ed suffixes.',
    output: 'Detected student entities + normalized keywords.',
    justification:
      'Whole-token matching prevents substring collisions (Ram vs. Ramesh) using plain string logic.',
    icon: Settings2,
  },
  {
    id: 'search',
    phase: 'Per-Question Pipeline',
    stepNumber: '04',
    title: 'Weighted Search & IF–THEN Reasoning',
    subtitle: 'Score all intents & select highest',
    input: 'Normalized tokens + Knowledge Base.',
    operation:
      'Sums matched keyword weights across all 7 intents, checks threshold (>= 2), promotes un-named list eligibility queries to shortage list, and applies IF–THEN formulas.',
    output: 'Selected intent, derived calculation, or "Information Not Found" branch.',
    justification:
      'Every answer is exact, repeatable, and auditable back to matched weights and stored numbers.',
    icon: Search,
  },
  {
    id: 'answer',
    phase: 'Per-Question Pipeline',
    stepNumber: '05',
    title: 'Answer Generation & Guarded Fallback',
    subtitle: 'Full-sentence output or safe prompt',
    input: 'Computed result or missing-data/not-found signal.',
    operation:
      'Formats exact figures into clear English sentences, or returns guarded error / "Student information not found." / supported-question fallback.',
    output: 'Final response shown to user with full reasoning trace.',
    justification:
      'Guarded lookups prevent crashes on incomplete records or zero working days.',
    icon: CheckCircle2,
  },
];

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  onTryQuestion,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('search');
  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === selectedStageId) || PIPELINE_STAGES[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="border-b border-slate-200 pb-6 space-y-2 max-w-3xl">
        <p className="text-xs font-medium text-slate-500">
          Section 3 &amp; Section 4 · System Design &amp; Classical AI Methodology
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          System Architecture &amp; Weighted Rule Base
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Built strictly with classical AI techniques—dictionary knowledge representation, weighted keyword scoring, search, and IF–THEN inference—without any NLP models, embeddings, or RAG pipelines.
        </p>
      </section>

      {/* Interactive Architecture Flowchart */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              System Architecture Flow (Fig. 1)
            </h2>
            <p className="text-xs text-slate-500">
              Select any stage below to inspect its inputs, classical AI operations, and design rationale.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Start-Up runs once · Query stages run per question
          </span>
        </div>

        {/* Visual Flow Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
          {PIPELINE_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isSelected = stage.id === activeStage.id;
            return (
              <div key={stage.id} className="flex flex-col lg:flex-row items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`flex-1 text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {stage.stepNumber}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500">
                      {stage.phase}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 leading-snug">
                      {stage.title}
                    </div>
                    <div className="text-xs text-slate-600">{stage.subtitle}</div>
                  </div>
                </button>
                {index < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-slate-300 shrink-0">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stage Inspector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-blue-700">
                Stage {activeStage.stepNumber} · {activeStage.phase}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {activeStage.title}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                Found &rarr; Answer
              </span>
              <span className="inline-flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                Missing &rarr; Not Found
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500">Input</div>
              <p className="text-slate-800 leading-relaxed">{activeStage.input}</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500">Operation</div>
              <p className="text-slate-800 leading-relaxed">{activeStage.operation}</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500">Output</div>
              <p className="text-slate-800 leading-relaxed">{activeStage.output}</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500">Justification</div>
              <p className="text-slate-800 leading-relaxed">{activeStage.justification}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Rule Base Table (Table 1) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Table 1. Weighted Keyword Rule Base
            </h2>
            <p className="text-xs text-slate-500">
              Distinctive words (e.g., percentage: 5, shortage: 4) outscore common terms (attendance: 2) so compound questions resolve accurately.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            7 Intents · Min Threshold: 2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Intent</th>
                <th className="py-2.5 pr-4 font-medium">Scope</th>
                <th className="py-2.5 pr-4 font-medium">Keywords (Weight)</th>
                <th className="py-2.5 font-medium">Rule Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RULE_BASE.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70">
                  <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                    {rule.label}
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500 capitalize whitespace-nowrap">
                    {rule.scope}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-700 tabular-nums">
                    {rule.keywords.map((k) => `${k.word} (${k.weight})`).join(', ')}
                  </td>
                  <td className="py-3 text-slate-700">{rule.ruleDescription}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Worked Example & Classical AI Justification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-900">
                Worked Example (Section 5)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onTryQuestion("Is Kiran's attendance eligible for exams?")}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Run in Workbench
            </button>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              <strong className="text-slate-900">Question:</strong>{' '}
              <span className="font-mono text-slate-800">
                &ldquo;Is Kiran&apos;s attendance eligible for exams?&rdquo;
              </span>
            </p>
            <div className="space-y-2 pl-1">
              <div className="flex items-start gap-2">
                <ArrowDown className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Entity &amp; Normalization:</strong>{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">kiran</code>{' '}
                  matches a student record; stop words removed and suffixes stripped yield{' '}
                  <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                    attendance, eligible, exam
                  </code>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowDown className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Intent Scoring:</strong> Eligibility scores{' '}
                  <span className="font-mono tabular-nums font-semibold">6</span> (eligible 4 + exam 2), Percentage scores{' '}
                  <span className="font-mono tabular-nums font-semibold">2</span> (attendance 2), all others 0. Eligibility wins.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>IF–THEN Execution:</strong>{' '}
                  <span className="font-mono tabular-nums">70 ÷ 100 × 100 = 70%</span>. Compared against document minimum{' '}
                  <span className="font-mono tabular-nums">75%</span> &rarr;{' '}
                  <em>&ldquo;Kiran has an attendance shortage (70% is below the required 75%).&rdquo;</em>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <BookOpen className="h-4 w-4 text-slate-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">
              Why Classical AI Over NLP / RAG?
            </h2>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-slate-900">Exact Arithmetic:</strong> Percentages and eligibility thresholds require deterministic division and comparison, not probabilistic token prediction.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-slate-900">Zero Training Overhead:</strong> With three structured fields per student, statistical models add latency and complexity with no benefit.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-slate-900">Full Explainability:</strong> Every response traces cleanly to matched keyword weights, the student record, and the exact rule applied.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
