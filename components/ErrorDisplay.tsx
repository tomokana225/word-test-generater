import React from 'react';
// FIX: Add './' to the types import to make it a relative path.
import { AppError } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ErrorDisplayProps {
    error: AppError;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4" role="alert">
            <div className="flex">
                <div className="flex-shrink-0">
                    <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-bold">エラーが発生しました</h3>
                    <div className="mt-2 text-sm">
                        <p className="whitespace-pre-wrap">{error.message}</p>
                    </div>
                    <div className="mt-2 text-xs text-red-700 font-mono">
                        <span>エラーコード: {error.code}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;