import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PresentationViewProps {
  slides: string[];
  onExit: () => void;
  onSave?: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ slides, onExit, onSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // Apply Prism.js syntax highlighting after each slide change
  useEffect(() => {
    if (slideRef.current && (window as any).Prism) {
      (window as any).Prism.highlightAllUnder(slideRef.current);
    }
  }, [currentIndex, slides]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
    }
    if (e.key === 'ArrowLeft') {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
    if (e.key === 'Escape') onExit();
  }, [slides.length, onExit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNext = () => setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
  const handlePrev = () => setCurrentIndex(prev => Math.max(prev - 1, 0));

  const handleSave = () => {
    if (onSave) {
      onSave();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (slides.length === 0) return null;

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: '#1c1917' }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
      />

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-16 py-12 overflow-auto">
        <div
          ref={slideRef}
          key={currentIndex}
          className="w-full max-w-6xl slide-html"
          style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
          dangerouslySetInnerHTML={{ __html: slides[currentIndex] || '' }}
        />
      </div>

      {/* Bottom controls */}
      <div className="relative z-[110] px-10 pb-8 flex justify-between items-end">
        {/* Left: slide number + branding */}
        <div className="flex items-center gap-5">
          <span
            className="text-5xl font-bold leading-none"
            style={{ color: 'rgba(255,255,255,0.08)', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {(currentIndex + 1).toString().padStart(2, '0')}
          </span>
          <div className="h-8 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              강의자료 뚝딱
            </span>
            <span className="text-xs" style={{ color: '#57534e' }}>프레젠테이션</span>
          </div>
        </div>

        {/* Right: nav controls */}
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={handlePrev}
            disabled={isFirstSlide}
            className="p-2.5 rounded-xl transition-all disabled:opacity-20"
            style={{ color: '#b8b2ad' }}
            onMouseEnter={(e) => !isFirstSlide && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="w-40 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / slides.length) * 100}%`,
                backgroundColor: '#f97316',
              }}
            />
          </div>

          <button
            onClick={handleNext}
            disabled={isLastSlide}
            className="p-2.5 rounded-xl transition-all disabled:opacity-20"
            style={{ color: '#b8b2ad' }}
            onMouseEnter={(e) => !isLastSlide && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="w-px h-5" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {onSave && (
            <button
              onClick={handleSave}
              className="p-2.5 rounded-xl transition-all"
              style={{ color: isSaved ? '#4ade80' : '#b8b2ad' }}
              title={isSaved ? '저장됨' : '슬라이드 저장'}
              onMouseEnter={(e) => !isSaved && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isSaved ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
            </button>
          )}

          <button
            onClick={toggleFullScreen}
            className="p-2.5 rounded-xl transition-all"
            style={{ color: '#b8b2ad' }}
            title="전체화면"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ color: '#b8b2ad', backgroundColor: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#b8b2ad'; }}
          >
            발표 종료
          </button>
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default PresentationView;
