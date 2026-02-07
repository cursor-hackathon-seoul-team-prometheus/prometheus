import React, { useState, useEffect } from 'react';
import { AppStep, Question, Answer, SavedLecture } from './types';
import { analyzeSyllabus, generateLectureMaterial } from './services/claudeService';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import RefinementForm from './components/RefinementForm';
import ResultView from './components/ResultView';
import PresentationView from './components/PresentationView';
import HomeView from './components/HomeView';

const STORAGE_KEY = 'lecturegen_saved_materials_v2';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.HOME);
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [finalContent, setFinalContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [savedLectures, setSavedLectures] = useState<SavedLecture[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse saved lectures", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLectures));
  }, [savedLectures]);

  const handleSyllabusUpload = async (text: string) => {
    setSyllabusText(text);
    setLoading(true);
    setStep(AppStep.ANALYZING);

    try {
      const analysis = await analyzeSyllabus(text);
      if (analysis.questions && analysis.questions.length > 0) {
        setQuestions(analysis.questions);
        setStep(AppStep.REFINE);
      } else {
        await handleGeneration([]); 
      }
    } catch (error) {
      alert("강의계획서 분석 중 오류가 발생했습니다.");
      setStep(AppStep.UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneration = async (answers: Answer[]) => {
    setLoading(true);
    setStep(AppStep.GENERATING);

    try {
      const content = await generateLectureMaterial(syllabusText, answers);
      setFinalContent(content);
      setStep(AppStep.RESULT);
    } catch (error) {
      alert("강의 자료 생성 중 오류가 발생했습니다.");
      setStep(AppStep.REFINE);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLecture = (content: string) => {
    const titleMatch = content.match(/^# (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Lecture";
    
    const newLecture: SavedLecture = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: Date.now()
    };
    
    setSavedLectures(prev => [newLecture, ...prev]);
  };

  const handleDeleteLecture = (id: string) => {
    if (confirm("이 강의 자료를 삭제하시겠습니까?")) {
      setSavedLectures(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleSelectLecture = (lecture: SavedLecture) => {
    setFinalContent(lecture.content);
    setStep(AppStep.RESULT);
  };

  const handleStartPresentation = (content: string) => {
    setFinalContent(content);
    setStep(AppStep.PRESENTATION);
  };

  const handleReset = () => {
    setSyllabusText('');
    setQuestions([]);
    setFinalContent('');
    setStep(AppStep.HOME);
  };

  const isWizardStep = [AppStep.UPLOAD, AppStep.ANALYZING, AppStep.REFINE, AppStep.GENERATING, AppStep.RESULT].includes(step);

  return (
    <div className={`min-h-screen flex flex-col ${step === AppStep.PRESENTATION ? 'overflow-hidden' : 'bg-[#fafaf9]'}`}>
      {step !== AppStep.PRESENTATION && (
        <header className="glass sticky top-0 z-[100] border-b border-stone-200/60 h-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={handleReset}
            >
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <span className="text-xl font-extrabold text-stone-900 tracking-tight">강의자료 <span className="text-orange-600">뚝딱</span></span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={handleReset} className="text-sm font-semibold text-stone-600 hover:text-orange-600 transition-colors">작업공간</button>
              <a href="#" className="text-sm font-semibold text-stone-600 hover:text-orange-600 transition-colors">문서</a>
              <div className="h-4 w-[1px] bg-stone-200"></div>
              {step !== AppStep.HOME && (
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
                >
                  세션 종료
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={`flex-grow ${step !== AppStep.PRESENTATION ? 'max-w-7xl mx-auto w-full px-6 py-12' : ''}`}>
        {isWizardStep && (
          <div className="mb-12">
            <StepIndicator currentStep={step} />
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {step === AppStep.HOME && (
            <HomeView 
              savedLectures={savedLectures} 
              onStartNew={() => setStep(AppStep.UPLOAD)} 
              onSelectLecture={handleSelectLecture}
              onDeleteLecture={handleDeleteLecture}
            />
          )}

          {(step === AppStep.UPLOAD || step === AppStep.ANALYZING) && (
            <FileUpload onContentReady={handleSyllabusUpload} isLoading={loading} />
          )}

          {(step === AppStep.REFINE || step === AppStep.GENERATING) && (
            <RefinementForm 
              questions={questions} 
              onSubmit={handleGeneration} 
              isLoading={loading}
            />
          )}

          {step === AppStep.RESULT && (
            <ResultView 
              content={finalContent} 
              onReset={handleReset} 
              onStartPresentation={handleStartPresentation} 
              onSave={handleSaveLecture}
            />
          )}

          {step === AppStep.PRESENTATION && (
            <PresentationView content={finalContent} onExit={() => setStep(AppStep.RESULT)} />
          )}
        </div>
      </main>

      {step !== AppStep.PRESENTATION && (
        <footer className="bg-white border-t border-stone-200 py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-stone-400 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
               <span className="font-bold text-stone-600">강의자료 뚝딱</span>
               <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex space-x-6 font-medium">
              <a href="#" className="hover:text-stone-900 transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-stone-900 transition-colors">이용약관</a>
              <a href="#" className="hover:text-stone-900 transition-colors">고객센터</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;