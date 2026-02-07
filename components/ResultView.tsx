import React, { useState, useEffect } from 'react';
import { refineSlideContent } from '../services/geminiService';

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
    .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black mb-8 text-slate-900 leading-tight">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-5 text-indigo-600 mt-10">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-4 text-slate-800 mt-8">$1</h3>')
    .replace(/^\> (.*$)/gim, '<div class="bg-indigo-50 border-l-4 border-indigo-500 p-6 italic text-slate-700 my-8 rounded-r-2xl font-medium"><span class="block text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-2">Speaker Note</span>$1</div>')
    .replace(/\*\*(.*)\*\*/gim, '<b class="font-bold text-slate-900">$1</b>')
    .replace(/\*(.*)\*/gim, '<i class="text-slate-500 italic">$1</i>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 list-none mb-3 text-slate-600 flex items-start leading-relaxed"><span class="inline-block w-2 h-2 bg-indigo-400 rounded-full mr-3 mt-2.5 flex-shrink-0"></span>$1</li>')
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
      alert("Voice recognition not supported in this browser.");
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
      alert("Failed to update slide.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 card-shadow gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Review Your Lecture</h2>
            <div className="flex items-center mt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-3">Status: Final Review</span>
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={handleSaveInternal} 
            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center shadow-lg border-2 ${isSaved ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'}`}
          >
            {isSaved ? (
              <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>Saved to Workspace</>
            ) : (
              <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>Save Project</>
            )}
          </button>
          <button 
            onClick={() => onStartPresentation(slides.join('\n'))} 
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center shadow-xl shadow-indigo-100 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
            Present Slides
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Preview */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-indigo-50 min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Slide Ribbon Indicator */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-700 ease-out"
                style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
              ></div>
            </div>

            <div className="p-10 md:p-16 flex-grow overflow-y-auto">
              {isUpdating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl z-[20] flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <p className="mt-6 font-bold text-slate-800 tracking-tight">AI Refining Content...</p>
                </div>
              )}
              {slides[currentIndex] && (
                <div 
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(slides[currentIndex]) }} 
                />
              )}
            </div>

            <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center rounded-b-[2.5rem] backdrop-blur-sm">
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-300 disabled:opacity-30 transition-all group"
              >
                <svg className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              
              <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Navigation</span>
                 <div className="flex items-center space-x-2">
                    <span className="text-xl font-extrabold text-slate-900">{currentIndex + 1}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm font-bold text-slate-400">{slides.length}</span>
                 </div>
              </div>

              <button 
                onClick={handleNext} 
                disabled={currentIndex === slides.length - 1} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-300 disabled:opacity-30 transition-all group"
              >
                <svg className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
          
          <div className="flex justify-center">
             <div className="flex items-center space-x-1 px-4 py-2 bg-slate-100 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Autosaved at {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
             </div>
          </div>
        </div>

        {/* Side Editor Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-32">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-lg leading-tight">Smart Editor</h3>
                <p className="text-slate-400 text-xs font-medium">Request changes to the current slide.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-5 text-sm text-slate-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-48 resize-none transition-all placeholder-slate-500 font-medium"
                  placeholder="e.g. 'Add a case study about Apple' or 'Make the tone more professional'..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  disabled={isUpdating}
                ></textarea>
                
                <button
                  onClick={startListening}
                  className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  title="Voice command"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
              </div>

              <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20">
                 <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-widest mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                    Pro Tip
                 </p>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">Our AI suggests adding a visual comparison table to this slide to improve retention.</p>
              </div>

              <button
                onClick={handleRefineSlide}
                disabled={!instruction.trim() || isUpdating}
                className="w-full py-4 bg-white text-slate-900 hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-black/20"
              >
                {isUpdating ? 'Generating...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;