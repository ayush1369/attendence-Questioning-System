import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  KnowledgeBase,
  PRESET_DOCUMENTS,
} from '../engine/attendanceQA';

interface KnowledgeBasePanelProps {
  rawDocument: string;
  onRawDocumentChange: (text: string) => void;
  kb: KnowledgeBase;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onUploadClick: () => void;
  onAskAboutStudent: (studentName: string) => void;
}

export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
  rawDocument,
  onRawDocumentChange,
  kb,
  activePresetId,
  onSelectPreset,
  onUploadClick,
  onAskAboutStudent,
}) => {
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('100');
  const [newPresent, setNewPresent] = useState('80');
  const [newAbsent, setNewAbsent] = useState('20');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = newName.trim();
    if (!cleanedName) {
      setFormError('Please enter a student name.');
      return;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(cleanedName)) {
      setFormError('Use alphanumeric characters for the student name.');
      return;
    }
    if (kb.students[cleanedName.toLowerCase()]) {
      setFormError(`"${cleanedName}" already exists in the Knowledge Base.`);
      return;
    }

    const totalVal = Number(newTotal);
    const presentVal = Number(newPresent);
    const absentVal = Number(newAbsent);
    if (
      !Number.isFinite(totalVal) ||
      !Number.isFinite(presentVal) ||
      !Number.isFinite(absentVal) ||
      totalVal < 0 ||
      presentVal < 0 ||
      absentVal < 0
    ) {
      setFormError('Please enter valid non-negative numbers for attendance days.');
      return;
    }

    setFormError(null);
    const newBlock = `Student: ${cleanedName}\nTotal Working Days: ${totalVal}\nPresent Days: ${presentVal}\nAbsent Days: ${absentVal}`;

    // Insert new student block before trailing document-level lines if present
    const lines = rawDocument.split(/\r?\n/);
    const minLineIndex = lines.findIndex((line) =>
      line.toLowerCase().includes('minimum') ||
      line.toLowerCase().includes('threshold') ||
      line.toLowerCase().includes('cutoff')
    );

    let updatedText = '';
    if (minLineIndex !== -1) {
      const before = lines.slice(0, minLineIndex).join('\n').trimEnd();
      const after = lines.slice(minLineIndex).join('\n').trimStart();
      updatedText = `${before ? before + '\n\n' : ''}${newBlock}\n\n${after}`;
    } else {
      updatedText = `${rawDocument.trimEnd()}\n\n${newBlock}`;
    }

    onRawDocumentChange(updatedText);
    setNewName('');
  };

  const handleRemoveStudent = (studentKey: string) => {
    const targetName = kb.students[studentKey]?.name.toLowerCase();
    if (!targetName) return;

    const lines = rawDocument.split(/\r?\n/);
    const keptLines: string[] = [];
    let skipping = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if (lower.startsWith('student:')) {
        const namePart = trimmed.slice('student:'.length).trim().toLowerCase();
        skipping = namePart === targetName;
        if (!skipping) keptLines.push(line);
        continue;
      }
      if (skipping) {
        if (
          trimmed === '' ||
          lower.includes('minimum') ||
          lower.includes('threshold') ||
          lower.includes('cutoff')
        ) {
          skipping = false;
          if (trimmed !== '') keptLines.push(line);
        }
        continue;
      }
      keptLines.push(line);
    }

    onRawDocumentChange(keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim());
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([rawDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Stage 1 · Document Processing &amp; Frame-Based Knowledge Representation
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Knowledge Base &amp; Document Editor
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Edit <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">attendance.txt</code> directly, add students, or load fault-reproduction scenarios. Shared student fields are grouped into student frames, while global policies remain document-level facts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload .txt
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export .txt
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('default')}
            className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Default
          </button>
        </div>
      </section>

      {/* Scenario Presets */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Document Scenarios &amp; Edge Cases
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_DOCUMENTS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">
                  {preset.label}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two-Column Split: Raw Document Editor + Structured KB Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Raw Document & Quick Add Student */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="raw-doc-editor"
                className="text-sm font-semibold text-slate-900"
              >
                Raw Input Document (attendance.txt)
              </label>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {rawDocument.split(/\r?\n/).length} lines
              </span>
            </div>
            <textarea
              id="raw-doc-editor"
              value={rawDocument}
              onChange={(e) => onRawDocumentChange(e.target.value)}
              rows={15}
              spellCheck={false}
              className="w-full p-3.5 text-xs sm:text-sm font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
            <p className="text-xs text-slate-500">
              Format: Begin each student block with <code className="font-mono">Student: Name</code> followed by <code className="font-mono">Field: value</code> lines.
            </p>
          </div>

          {/* Add Student Form */}
          <form
            onSubmit={handleAddStudent}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Append Student Record
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="new-student-name"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Student Name
                </label>
                <input
                  id="new-student-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Ananya"
                  className="w-full min-h-[40px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>
              <div>
                <label
                  htmlFor="new-student-total"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Total Working Days
                </label>
                <input
                  id="new-student-total"
                  type="number"
                  min={0}
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="new-student-present"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Present
                  </label>
                  <input
                    id="new-student-present"
                    type="number"
                    min={0}
                    value={newPresent}
                    onChange={(e) => setNewPresent(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-student-absent"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Absent
                  </label>
                  <input
                    id="new-student-absent"
                    type="number"
                    min={0}
                    value={newAbsent}
                    onChange={(e) => setNewAbsent(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-red-700">{formError}</p>
            )}

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Student to Document
            </button>
          </form>
        </div>

        {/* Right: Parsed Structured Knowledge Base */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Constructed Knowledge Base
                </h2>
                <p className="text-xs text-slate-500">
                  In-memory dictionary representation extracted from raw text.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Parsed
              </span>
            </div>

            {/* Document-Level Facts */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-700">
                Document-Level Facts
              </h3>
              {Object.keys(kb.documentFacts).length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                  No document-level facts extracted. Add a line like <code className="font-mono">Minimum Required Attendance: 75%</code>.
                </p>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 font-mono text-xs text-slate-800 tabular-nums space-y-1">
                  {Object.entries(kb.documentFacts).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span>&quot;{key}&quot;</span>
                      <span className="font-semibold text-blue-700">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Records */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-700">
                Student Frame Records ({kb.studentOrder.length})
              </h3>
              {kb.studentOrder.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                  No student records found.
                </p>
              ) : (
                <div className="space-y-3">
                  {kb.studentOrder.map((key) => {
                    const st = kb.students[key];
                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {st.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onAskAboutStudent(st.name)}
                              className="text-xs font-medium text-blue-700 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              Query Student
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(key)}
                              aria-label={`Remove ${st.name}`}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                          <div className="bg-white border border-slate-200/70 rounded px-2.5 py-1.5">
                            <div className="text-slate-500 text-[11px]">Working</div>
                            <div className="font-semibold text-slate-900">
                              {st.fields['total working days'] ?? 'Missing'}
                            </div>
                          </div>
                          <div className="bg-white border border-slate-200/70 rounded px-2.5 py-1.5">
                            <div className="text-slate-500 text-[11px]">Present</div>
                            <div className="font-semibold text-slate-900">
                              {st.fields['present days'] ?? 'Missing'}
                            </div>
                          </div>
                          <div className="bg-white border border-slate-200/70 rounded px-2.5 py-1.5">
                            <div className="text-slate-500 text-[11px]">Absent</div>
                            <div className="font-semibold text-slate-900">
                              {st.fields['absent days'] ?? 'Missing'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Parse Warnings */}
            {kb.warnings.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Parser Diagnostics ({kb.warnings.length})
                </div>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  {kb.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
