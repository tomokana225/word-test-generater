
import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface StepperProps {
    currentStep: number;
    mode: 'vocabulary' | 'listening';
}

const Stepper: React.FC<StepperProps> = ({ currentStep, mode }) => {
    let steps = [
        { id: 1, name: '単語の準備' },
        { id: 2, name: '問題設定' },
        { id: 3, name: '確認・編集' },
    ];

    if (mode === 'listening') {
        steps = [
            { id: 2, name: 'リスニング設定' },
            { id: 3, name: '確認・編集' },
        ];
    }

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-center">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1 max-w-xs' : ''} flex items-center`}>
                        {step.id < currentStep ? (
                            // Completed Step
                            <div className="flex items-center group">
                                <span className="flex h-9 items-center">
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800 transition-colors">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                    </span>
                                </span>
                                <span className="ml-3 text-sm font-medium text-slate-900 group-hover:text-indigo-800 transition-colors">{step.name}</span>
                            </div>
                        ) : step.id === currentStep ? (
                            // Current Step
                            <div className="flex items-center" aria-current="step">
                                <span className="flex h-9 items-center">
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white shadow-sm">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                    </span>
                                </span>
                                <span className="ml-3 text-sm font-bold text-indigo-600">{step.name}</span>
                            </div>
                        ) : (
                            // Upcoming Step
                             <div className="flex items-center group">
                                <span className="flex h-9 items-center">
                                     <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 bg-white group-hover:border-slate-300 transition-colors">
                                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-slate-200 transition-colors" />
                                    </span>
                                </span>
                               <span className="ml-3 text-sm font-medium text-slate-400 group-hover:text-slate-500 transition-colors">{step.name}</span>
                            </div>
                        )}

                        {/* Connector */}
                        {stepIdx !== steps.length - 1 && (
                            <div className="flex-1 mx-4 h-0.5 bg-slate-200" aria-hidden="true" />
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Stepper;
