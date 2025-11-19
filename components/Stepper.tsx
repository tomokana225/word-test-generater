import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface StepperProps {
    currentStep: number;
}

const steps = [
    { id: 1, name: '単語の準備' },
    { id: 2, name: '問題設定' },
    { id: 3, name: '確認・編集' },
];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                        {step.id < currentStep ? (
                            // Completed Step
                            <div className="flex items-center">
                                <span className="flex h-9 items-center">
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                    </span>
                                </span>
                                <span className="ml-4 text-sm font-medium text-slate-900">{step.name}</span>
                            </div>
                        ) : step.id === currentStep ? (
                            // Current Step
                            <div className="flex items-center" aria-current="step">
                                <span className="flex h-9 items-center">
                                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                                    </span>
                                </span>
                                <span className="ml-4 text-sm font-medium text-indigo-600">{step.name}</span>
                            </div>
                        ) : (
                            // Upcoming Step
                             <div className="flex items-center">
                                <span className="flex h-9 items-center">
                                     <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white group-hover:border-slate-400">
                                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-slate-300" />
                                    </span>
                                </span>
                               <span className="ml-4 text-sm font-medium text-slate-500">{step.name}</span>
                            </div>
                        )}

                        {/* Connector */}
                        {stepIdx !== steps.length - 1 ? (
                            <div className="absolute top-4 left-4 -ml-px mt-0.5 h-0.5 w-full bg-slate-300" aria-hidden="true" />
                        ) : null}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Stepper;
