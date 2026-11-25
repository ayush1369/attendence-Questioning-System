import React, { useMemo, useRef, useState } from 'react';
import { Menu, Upload, X } from 'lucide-react';
import {
  DEFAULT_ATTENDANCE_TXT,
  FaultEntry,
  PRESET_DOCUMENTS,
  parseAttendanceDocument,
} from './engine/attendanceQA';
import { AskWorkbench, EngineMode } from './components/AskWorkbench';
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel';
import { ArchitectureView } from './components/ArchitectureView';
import { EvaluationView } from './components/EvaluationView';

type ActiveTab = 'ask' | 'kb' | 'architecture' | 'evaluation';

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'ask', label: 'Ask System' },
  { id: 'kb', label: 'Knowledge Base' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'evaluation', label: 'Evaluation' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ask');
  const [rawDocument, setRawDocument] = useState<string>(DEFAULT_ATTENDANCE_TXT);
  const [activePresetId, setActivePresetId] = useState<string>('default');
  const [question, setQuestion] = useState<string>(
    "Is Kiran's attendance eligible for exams?"
  );
  const [engineMode, setEngineMode] = useState<EngineMode>('final');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const kb = useMemo(() => parseAttendanceDocument(rawDocument), [rawDocument]);

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_DOCUMENTS.find((d) => d.id === presetId);
    if (found) {
      setRawDocument(found.content);
      setActivePresetId(found.id);
      setUploadNotice(null);
    }
  };

  const handleRawDocumentChange = (text: string) => {
    setRawDocument(text);
    const matchingPreset = PRESET_DOCUMENTS.find((d) => d.content === text);
    setActivePresetId(matchingPreset ? matchingPreset.id : 'custom');
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (content.trim()) {
        setRawDocument(content);
        setActivePresetId('custom');
        setUploadNotice(`Loaded "${file.name}" into the Knowledge Base.`);
        setActiveTab('kb');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSwitchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectQuestion = (q: string) => {
    setQuestion(q);
    setEngineMode('compare');
    setActiveTab('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestFault = (fault: FaultEntry) => {
    setRawDocument(fault.demoDocument);
    const matchingPreset = PRESET_DOCUMENTS.find(
      (d) => d.content === fault.demoDocument
    );
    setActivePresetId(matchingPreset ? matchingPreset.id : 'custom');
    setQuestion(fault.demoQuestion);
    setEngineMode('compare');
    setActiveTab('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryQuestion = (q: string) => {
    setQuestion(q);
    setActiveTab('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAboutStudent = (studentName: string) => {
    setQuestion(`Is ${studentName} eligible?`);
    setActiveTab('ask');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Hidden File Input for .txt Attendance Document Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload attendance text file"
      />

      {/* Top Bar Contract: 1-row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSwitchTab('ask')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            AttendQA
          </button>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSwitchTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-blue-700 border-blue-700'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action + mobile menu button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerUpload}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload .txt</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSwitchTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uploadNotice && activeTab === 'kb' && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-xs sm:text-sm text-blue-900">
            <span>{uploadNotice}</span>
            <button
              type="button"
              onClick={() => setUploadNotice(null)}
              aria-label="Dismiss notice"
              className="text-blue-700 hover:text-blue-900 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {activeTab === 'ask' && (
          <AskWorkbench
            kb={kb}
            rawDocument={rawDocument}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onOpenKnowledgeBase={() => handleSwitchTab('kb')}
            question={question}
            onQuestionChange={setQuestion}
            engineMode={engineMode}
            onEngineModeChange={setEngineMode}
          />
        )}

        {activeTab === 'kb' && (
          <KnowledgeBasePanel
            rawDocument={rawDocument}
            onRawDocumentChange={handleRawDocumentChange}
            kb={kb}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onUploadClick={handleTriggerUpload}
            onAskAboutStudent={handleAskAboutStudent}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView onTryQuestion={handleTryQuestion} />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationView
            onInspectQuestion={handleInspectQuestion}
            onTestFault={handleTestFault}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            AI-Based Student Attendance Document Question Answering System · Classical Rule &amp; Search Engine (Zero NLP / Zero RAG)
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleSwitchTab('architecture')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Rule Base
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('evaluation')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Benchmark Results
            </button>
            <a
              href="/assets/aistudio/Ayush_S_Gowda_ai_assignment_IEEE_report_5082679e.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              IEEE Report PDF
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
