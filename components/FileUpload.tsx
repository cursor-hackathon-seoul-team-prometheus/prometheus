import React, { useState, useRef } from 'react';
import { LectureInfo } from '../types';
import { extractSyllabusFromFile } from '../services/claudeService';

interface FileUploadProps {
  onContentReady: (text: string, info: LectureInfo) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onContentReady, isLoading }) => {
  const [text, setText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [className, setClassName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [classHours, setClassHours] = useState<number>(1);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setIsExtracting(true);
      try {
        const base64Data = await fileToBase64(file);
        const extractedText = await extractSyllabusFromFile(base64Data, file.type);
        setText(prev => prev ? prev + "\n\n" + extractedText : extractedText);
      } catch (err) {
        console.error(err);
        alert("문서 분석 중 오류가 발생했습니다.");
      } finally {
        setIsExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    } else {
      alert("지원하지 않는 형식입니다. PDF, 이미지 또는 텍스트를 사용해주세요.");
    }
  };

  const handleSubmit = () => {
    if (text.trim().length < 50) {
      alert("최소 50자 이상의 강의계획서 내용을 입력해주세요.");
      return;
    }
    onContentReady(text, {
      companyName,
      className,
      targetAudience,
      keywords,
      classHours,
    });
  };

  const isBusy = isLoading || isExtracting;

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-stone-700 placeholder-stone-400 bg-stone-50/50 font-medium text-sm";
  const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-stone-900 mb-3 tracking-tight">강의 정보 입력</h2>
        <p className="text-stone-500 max-w-md mx-auto font-medium">
          강의 기본 정보와 계획서를 입력하여 맞춤형 강의 자료를 생성하세요.
        </p>
      </div>

      {/* 강의 메타데이터 입력 */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-100/40 p-10 border border-stone-100">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mr-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-stone-900">강의 기본 정보</h3>
            <p className="text-xs text-stone-400 font-medium">입력된 정보가 강의 자료에 반영됩니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>기업명</label>
            <input
              type="text"
              className={inputClass}
              placeholder="예: 삼성전자"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div>
            <label className={labelClass}>수업명</label>
            <input
              type="text"
              className={inputClass}
              placeholder="예: 클라우드 컴퓨팅 기초"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div>
            <label className={labelClass}>대상</label>
            <input
              type="text"
              className={inputClass}
              placeholder="예: 신입 개발자, 비전공 직무전환자"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div>
            <label className={labelClass}>수업시수</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                className={inputClass + " pr-12"}
                placeholder="1"
                value={classHours}
                onChange={(e) => setClassHours(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isBusy}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">시간</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>수업내용 주요 키워드</label>
            <input
              type="text"
              className={inputClass}
              placeholder="예: AWS, Docker, Kubernetes, CI/CD, 마이크로서비스"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={isBusy}
            />
            <p className="text-[11px] text-stone-400 mt-1.5 ml-1">쉼표로 구분하여 입력하세요.</p>
          </div>
        </div>
      </div>

      {/* 강의계획서 내용 */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-orange-100/40 p-10 border border-stone-100 overflow-hidden">
        <div className="relative mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">강의계획서 내용</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-stone-400 hover:text-orange-600 flex items-center transition-colors"
              disabled={isBusy}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
              PDF 또는 이미지 업로드
            </button>
          </div>
          <textarea
            className={`w-full h-64 p-6 rounded-2xl border border-stone-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all text-stone-700 placeholder-stone-400 bg-stone-50/50 font-medium text-base leading-relaxed ${isExtracting ? 'opacity-50' : ''}`}
            placeholder="강의계획서 내용을 입력 또는 붙여넣기 하세요... (목표, 주제, 주차별 계획 등)"
            value={text}
            onChange={handleTextChange}
            disabled={isBusy}
          ></textarea>
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.md,.pdf,image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />

          {isExtracting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md rounded-2xl z-10">
               <div className="w-12 h-12 border-4 border-stone-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
               <span className="text-sm font-bold text-orange-700">파일에서 내용을 추출하는 중...</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isBusy || text.trim().length === 0}
          className="w-full py-5 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-stone-200 active:scale-[0.98] flex items-center justify-center overflow-hidden relative"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              강의계획서 분석 중...
            </span>
          ) : (
            <>
              다음: 분석 및 보완
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center space-x-8">
         <div className="flex items-center text-stone-400 text-xs font-bold uppercase tracking-widest">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            안전한 데이터
         </div>
         <div className="flex items-center text-stone-400 text-xs font-bold uppercase tracking-widest">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI 최적화
         </div>
      </div>
    </div>
  );
};

export default FileUpload;
