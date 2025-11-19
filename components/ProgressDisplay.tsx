// FIX: Create new file for the ProgressDisplay component.
import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ProgressDisplayProps {
    message: string;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-8 space-y-4 h-full">
            <SpinnerIcon className="w-8 h-8 text-indigo-500" />
            <p className="text-slate-600 font-medium">{message}</p>
        </div>
    );
};

export default ProgressDisplay;
