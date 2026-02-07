import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.UPLOAD, label: 'Upload' },
  { id: AppStep.REFINE, label: 'Refine' },
  { id: AppStep.RESULT, label: 'Review' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const getStepStatus = (stepId: AppStep) => {
    const stepOrder = [AppStep.UPLOAD, AppStep.ANALYZING, AppStep.REFINE, AppStep.GENERATING, AppStep.RESULT];
    let currentVisualIndex = 0;
    if (currentStep === AppStep.REFINE || currentStep === AppStep.GENERATING) currentVisualIndex = 1;
    if (currentStep === AppStep.RESULT) currentVisualIndex = 2;
    if (currentStep === AppStep.ANALYZING) currentVisualIndex = 0;

    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentVisualIndex) return 'completed';
    if (stepIndex === currentVisualIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center group relative">
                <div 
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 border-2 shadow-sm
                    ${status === 'completed' ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' : 
                      status === 'active' ? 'bg-white border-indigo-600 text-indigo-600 scale-105' : 
                      'bg-white border-slate-200 text-slate-400'}`}
                >
                  {status === 'completed' ? (
                    <svg className="w-6 h-6 animate-in zoom-in-50 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    <span>0{index + 1}</span>
                  )}
                </div>
                <div className="absolute top-14 whitespace-nowrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'active' ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-grow mx-4 h-[2px] bg-slate-100 rounded-full relative overflow-hidden">
                   <div 
                    className="absolute inset-0 bg-indigo-600 transition-all duration-700 ease-in-out origin-left"
                    style={{ 
                      transform: status === 'completed' ? 'scaleX(1)' : 'scaleX(0)' 
                    }}
                   ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;