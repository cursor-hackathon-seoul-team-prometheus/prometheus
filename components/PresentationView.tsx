import React, { useState, useEffect, useRef } from 'react';

interface PresentationViewProps {
  content: string;
  onExit: () => void;
}

const parseSlides = (markdown: string): string[] => {
  if (!markdown) return [];
  const rawSlides = markdown.split(/(?=^# )/gm);
  return rawSlides.filter(s => s.trim().length > 0);
};

const renderSlideMarkdown = (text: string) => {
  if (!text) return '';
  // Enhanced renderer for presentation mode
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-6xl font-extrabold mb-12 text-slate-900 tracking-tight leading-tight">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-4xl font-bold mb-8 text-indigo-600 mt-12">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-3xl font-semibold mb-6 text-slate-700 mt-8">$1</h3>')
    .replace(/^\> (.*$)/gim, '<div class="hidden"></div>') // Hide speaker notes in presentation
    .replace(/\*\*(.*)\*\*/gim, '<b class="font-bold text-slate-900">$1</b>')
    .replace(/^- (.*$)/gim, '<li class="ml-12 list-none mb-6 text-3xl text-slate-600 relative before:content-[\'\'] before:absolute before:-left-8 before:top-4 before:w-3 before:h-3 before:bg-indigo-400 before:rounded-full leading-relaxed">$1</li>')
    .replace(/<\/li>\n<li/gim, '</li><li')
    .replace(/\n/gim, '<br />');
};

const PresentationView: React.FC<PresentationViewProps> = ({ content, onExit }) => {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseSlides(content);
    setSlides(parsed);
    setCurrentIndex(0); // Reset index when content changes
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onExit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, Math.max(0, slides.length - 1)));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (slides.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-12 overflow-hidden select-none"
    >
      {/* Logo in Top Right */}
      <div className="absolute top-12 right-12 z-[110]">
        <img 
          src="/static/logo.jpg" 
          alt="Logo" 
          className="h-12 w-auto object-contain mix-blend-multiply opacity-90"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>

      {/* Figma-style Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-50 rounded-bl-full -z-10 opacity-30 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-slate-100 rounded-tr-full -z-10 opacity-40 blur-3xl"></div>

      {/* Slide Content Area */}
      <div className="w-full max-w-7xl h-full flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
        {slides[currentIndex] && (
          <div 
            className="presentation-markdown prose-xl max-w-none px-12"
            dangerouslySetInnerHTML={{ __html: renderSlideMarkdown(slides[currentIndex]) }}
          />
        )}
      </div>

      {/* UI Controls */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-end pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-6">
          <div className="flex flex-col">
            <span className="text-6xl font-black text-slate-100 leading-none">{(currentIndex + 1).toString().padStart(2, '0')}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Slide Number</span>
          </div>
          <div className="h-12 w-px bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">LectureGen AI</span>
            <span className="text-xs text-slate-400">Presentation Deck</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center space-x-4 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-100">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          
          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
            ></div>
          </div>

          <button 
            onClick={handleNext} 
            disabled={currentIndex === slides.length - 1}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <div className="w-px h-6 bg-slate-200 mx-2"></div>

          <button 
            onClick={toggleFullScreen}
            className="p-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all"
            title="전체화면"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
          </button>

          <button 
            onClick={onExit}
            className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl text-sm font-bold transition-all"
          >
            발표 종료
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresentationView;