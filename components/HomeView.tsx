import React from 'react';
import { SavedLecture } from '../types';

interface HomeViewProps {
  savedLectures: SavedLecture[];
  onStartNew: () => void;
  onSelectLecture: (lecture: SavedLecture) => void;
  onDeleteLecture: (id: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ savedLectures, onStartNew, onSelectLecture, onDeleteLecture }) => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 rounded-[2.5rem] p-8 md:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-500 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-amber-500 rounded-full blur-[100px] opacity-10"></div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs font-bold uppercase tracking-widest mb-6">
            AI 강의 도우미
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            전문적인 <span className="text-orange-400">강의 자료</span>를 몇 분 만에 완성하세요.
          </h1>
          <p className="text-stone-300 text-lg mb-10 leading-relaxed max-w-lg">
            강의 계획서를 업로드하면 AI가 구조화, 콘텐츠 생성, 슬라이드 디자인까지 처리해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onStartNew}
              className="px-8 py-4 bg-white text-stone-900 rounded-2xl font-bold text-lg hover:bg-stone-100 transition-all flex items-center justify-center group shadow-xl shadow-white/10"
            >
              새 프로젝트 시작
              <svg className="w-5 h-5 ml-2 group-hover:transtone-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </button>
            <button className="px-8 py-4 bg-stone-800 text-white rounded-2xl font-bold text-lg border border-stone-700 hover:bg-stone-700 transition-all">
              데모 보기
            </button>
          </div>
        </div>
      </section>

      {/* 작업 공간 섹션 */}
      
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-stone-900">내 작업 공간</h3>
            <p className="text-stone-500 text-sm mt-1">최근 생성한 강의 자료를 이어서 작업하세요.</p>
          </div>
          <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase">
            {savedLectures.length}개의 강의
          </span>
        </div>

        {savedLectures.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-stone-200">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
            </div>
            <h4 className="text-xl font-bold text-stone-800 mb-2">아직 프로젝트가 없습니다</h4>
            <p className="text-stone-400 max-w-xs mx-auto mb-8">AI 기반 강의 자료를 처음 만들어 보시겠어요?</p>
            <button onClick={onStartNew} className="text-orange-600 font-bold hover:underline">지금 시작하기 &rarr;</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLectures.sort((a, b) => b.createdAt - a.createdAt).map((lecture) => (
              <div 
                key={lecture.id} 
                className="bg-white rounded-[2rem] p-7 border border-stone-200/60 card-shadow card-hover transition-all group cursor-pointer flex flex-col min-h-[220px]"
                onClick={() => onSelectLecture(lecture)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteLecture(lecture.id); }}
                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-lg text-stone-800 line-clamp-2 leading-snug mb-3 group-hover:text-orange-600 transition-colors">{lecture.title}</h4>
                </div>
                <div className="flex items-center text-xs font-bold text-stone-400 uppercase tracking-widest mt-4">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {new Date(lecture.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </div>
              </div>
            ))}
            
            {/* 새 프로젝트 카드 */}
            <div 
              onClick={onStartNew}
              className="bg-stone-50 rounded-[2rem] p-7 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center group cursor-pointer hover:border-orange-300 hover:bg-white transition-all min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-stone-400 group-hover:bg-orange-600 group-hover:text-white shadow-sm mb-4 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              </div>
              <span className="font-bold text-stone-600 group-hover:text-orange-600">새 프로젝트</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeView;