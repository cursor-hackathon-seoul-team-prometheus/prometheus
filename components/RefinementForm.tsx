import React, { useState } from 'react';
import { Question, Answer } from '../types';

interface RefinementFormProps {
  questions: Question[];
  onSubmit: (answers: Answer[]) => void;
  isLoading: boolean;
}

const RefinementForm: React.FC<RefinementFormProps> = ({ questions, onSubmit, isLoading }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers: Answer[] = questions.map(q => ({
      questionId: q.id,
      questionText: q.question,
      answer: answers[q.id] || "답변 없음"
    }));
    onSubmit(formattedAnswers);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">추가 정보가 필요합니다</h2>
        <p className="text-slate-500">완벽한 강의 자료 생성을 위해 몇 가지 질문에 답해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <label className="block text-slate-800 font-semibold mb-2">
              {q.question}
            </label>
            <p className="text-xs text-slate-500 mb-3 italic">
              <span className="font-semibold text-indigo-500">질문 이유:</span> {q.context}
            </p>
            
            {q.type === 'choice' && q.options ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleInputChange(q.id, option)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-all text-left
                      ${answers[q.id] === option 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                required
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 text-sm"
                placeholder="답변을 입력해주세요..."
                value={answers[q.id] || ''}
                onChange={(e) => handleInputChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                강의 자료 생성 중...
              </>
            ) : (
              '강의 자료 생성하기'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RefinementForm;