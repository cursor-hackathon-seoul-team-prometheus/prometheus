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

  // Process lines individually for better control
  const lines = text.split('\n');
  let html = '';
  let inBulletGroup = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1 title
    if (/^# (.*)$/.test(line)) {
      if (inBulletGroup) { html += '</div>'; inBulletGroup = false; }
      html += line.replace(/^# (.*)$/, '<h1>$1</h1>');
      continue;
    }

    // H2 → pill badge
    if (/^## (.*)$/.test(line)) {
      if (inBulletGroup) { html += '</div>'; inBulletGroup = false; }
      html += line.replace(/^## (.*)$/, '<h2>$1</h2>');
      continue;
    }

    // H3 → subtitle
    if (/^### (.*)$/.test(line)) {
      if (inBulletGroup) { html += '</div>'; inBulletGroup = false; }
      html += line.replace(/^### (.*)$/, '<h3>$1</h3>');
      continue;
    }

    // Speaker notes → hidden
    if (/^> (.*)$/.test(line)) {
      continue;
    }

    // Bullet items
    if (/^- (.*)$/.test(line)) {
      if (!inBulletGroup) {
        html += '<div class="slide-bullets">';
        inBulletGroup = true;
      } else {
        html += '<hr class="bullet-divider" />';
      }
      const content = line.replace(/^- (.*)$/, '$1')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      html += `<div class="slide-bullet">${content}</div>`;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inBulletGroup) { html += '</div>'; inBulletGroup = false; }
      continue;
    }

    // Regular paragraph
    if (inBulletGroup) { html += '</div>'; inBulletGroup = false; }
    const processed = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html += `<p>${processed}</p>`;
  }

  if (inBulletGroup) html += '</div>';
  return html;
};

const PresentationView: React.FC<PresentationViewProps> = ({ content, onExit }) => {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseSlides(content);
    setSlides(parsed);
    setCurrentIndex(0);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentIndex(prev => Math.min(prev + 1, Math.max(0, slides.length - 1)));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Escape') onExit();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onExit]);

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
      <div className="flex-1 flex items-center px-16 py-20">
        <div
          key={currentIndex}
          className="w-full max-w-6xl presentation-markdown"
          style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
        >
          {slides[currentIndex] && (
            <div dangerouslySetInnerHTML={{ __html: renderSlideMarkdown(slides[currentIndex]) }} />
          )}
        </div>
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
