import React, { useState, useEffect } from 'react';
import { refineSlideContent } from '../services/claudeService';

interface ResultViewProps {
  content: string;
  onReset: () => void;
  onStartPresentation: (updatedContent: string) => void;
  onSave: (content: string) => void;
}

const parseSlides = (markdown: string): string[] => {
  if (!markdown) return [];
  const rawSlides = markdown.split(/(?=^# )/gm);
  return rawSlides.filter(s => s.trim().length > 0);
};

const renderMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black mb-8 text-stone-900 leading-tight">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-5 text-orange-600 mt-10">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-4 text-stone-800 mt-8">$1</h3>')
    .replace(/^\> (.*$)/gim, '<div class="bg-orange-50 border-l-4 border-orange-500 p-6 italic text-stone-700 my-8 rounded-r-2xl font-medium"><span class="block text-orange-500 text-[10px] font-black uppercase tracking-widest mb-2">발표자 노트</span>$1</div>')
    .replace(/\*\*(.*)\*\*/gim, '<b class="font-bold text-stone-900">$1</b>')
    .replace(/\*(.*)\*/gim, '<i class="text-stone-500 italic">$1</i>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 list-none mb-3 text-stone-600 flex items-start leading-relaxed"><span class="inline-block w-2 h-2 bg-orange-400 rounded-full mr-3 mt-2.5 flex-shrink-0"></span>$1</li>')
    .replace(/<\/li>\n<li/gim, '</li><li')
    .replace(/\n/gim, '<br />');
};

const ResultView: React.FC<ResultViewProps> = ({ content, onReset, onStartPresentation, onSave }) => {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (content) {
      const parsed = parseSlides(content);
      setSlides(parsed);
      setCurrentIndex(0);
      setIsSaved(false);
    }
  }, [content]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setInstruction('');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
    setInstruction('');
  };

  const handleSaveInternal = () => {
    onSave(slides.join('\n'));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("이 브라우저에서는 음성 인식이 지원되지 않습니다.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInstruction(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleRefineSlide = async () => {
    if (!instruction.trim()) return;
    setIsUpdating(true);
    try {
      const refinedSlide = await refineSlideContent(slides[currentIndex], instruction);
      const newSlides = [...slides];
      newSlides[currentIndex] = refinedSlide;
      setSlides(newSlides);
      setInstruction('');
      setIsSaved(false);
    } catch (e) {
      alert("슬라이드 수정에 실패했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-stone-200/60 card-shadow gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">강의 자료 검토</h2>
            <div className="flex items-center mt-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mr-3">상태: 최종 검토</span>
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={handleSaveInternal} 
            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center shadow-lg border-2 ${isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-stone-100 text-stone-700 hover:border-orange-500 hover:text-orange-600'}`}
          >
            {isSaved ? (
              <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>작업공간에 저장됨</>
            ) : (
              <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>프로젝트 저장</>
            )}
          </button>
          <button 
            onClick={() => onStartPresentation(slides.join('\n'))} 
            className="px-8 py-3.5 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center shadow-xl shadow-orange-100 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
            슬라이드 발표
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Preview */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-stone-200/60 shadow-2xl shadow-orange-50 min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Slide Ribbon Indicator */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-stone-50 overflow-hidden">
              <div 
                className="h-full bg-orange-600 transition-all duration-700 ease-out"
                style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
              ></div>
            </div>

            <div className="p-10 md:p-16 flex-grow overflow-y-auto">
              {isUpdating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl z-[20] flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-stone-100 border-t-orange-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <p className="mt-6 font-bold text-stone-800 tracking-tight">AI가 내용을 수정하는 중...</p>
                </div>
              )}
              {slides[currentIndex] && (
                <div 
                  className="prose prose-stone max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(slides[currentIndex]) }} 
                />
              )}
            </div>

          </div>
          
          <div className="flex justify-center">
             <div className="flex items-center space-x-1 px-4 py-2 bg-stone-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">자동 저장됨 {new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'})}</span>
             </div>
          </div>
        </div>

        {/* Side Editor Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-4">
          {/* Slide Navigation */}
          <div className="bg-white rounded-2xl border border-stone-200/60 card-shadow p-5 flex justify-between items-center">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0} 
              className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center hover:bg-stone-100 hover:border-orange-300 disabled:opacity-30 transition-all group"
            >
              <svg className="w-5 h-5 text-stone-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            
            <div className="flex items-center space-x-3">
              <span className="text-xl font-extrabold text-stone-900">{currentIndex + 1}</span>
              <span className="text-stone-300">/</span>
              <span className="text-sm font-bold text-stone-400">{slides.length}</span>
            </div>

            <button 
              onClick={handleNext} 
              disabled={currentIndex === slides.length - 1} 
              className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center hover:bg-stone-100 hover:border-orange-300 disabled:opacity-30 transition-all group"
            >
              <svg className="w-5 h-5 text-stone-600 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          {/* Smart Editor */}
          <div className="bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 text-white">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg shadow-orange-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">스마트 편집기</h3>
                <p className="text-stone-400 text-xs font-medium">현재 슬라이드의 수정 사항을 요청하세요.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <textarea
                  className="w-full bg-stone-800 border border-stone-700 rounded-2xl p-5 text-sm text-stone-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none h-48 resize-none transition-all placeholder-stone-500 font-medium"
                  placeholder="예: 'Apple 사례 연구 추가' 또는 '더 전문적인 톤으로 변경'..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  disabled={isUpdating}
                ></textarea>
                
                <button
                  onClick={startListening}
                  className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-700 text-stone-400 hover:text-white'}`}
                  title="음성 명령"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
              </div>

              <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/20">
                 <p className="text-[11px] text-orange-300 font-bold uppercase tracking-widest mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                    프로 팁
                 </p>
                 <p className="text-xs text-stone-400 leading-relaxed font-medium">AI가 이 슬라이드에 시각적 비교 표를 추가하여 기억력을 높일 것을 제안합니다.</p>
              </div>

              <button
                onClick={handleRefineSlide}
                disabled={!instruction.trim() || isUpdating}
                className="w-full py-4 bg-white text-stone-900 hover:bg-stone-100 disabled:bg-stone-800 disabled:text-stone-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-black/20"
              >
                {isUpdating ? '생성 중...' : '변경사항 적용'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;