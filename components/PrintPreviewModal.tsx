import React, { ReactNode, useEffect, useState } from 'react';
import { PrintIcon } from './icons/PrintIcon';

interface PrintPreviewModalProps {
    onClose: () => void;
    onPrint: () => void;
    onModeChange: (mode: 'paged' | 'continuous') => void;
    children: ReactNode; // Expecting an iframe now
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ onClose, onPrint, onModeChange, children }) => {
    const [mode, setMode] = useState<'paged' | 'continuous'>('paged');

    // Add a keyboard listener for the Escape key to close the modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleModeChange = (newMode: 'paged' | 'continuous') => {
        setMode(newMode);
        onModeChange(newMode);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print" 
            aria-modal="true" 
            role="dialog"
            onClick={onClose}
        >
            <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-5xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-slate-800">印刷プレビュー</h2>
                        
                        <div className="flex bg-slate-200 rounded-lg p-1 text-sm font-medium">
                             <button 
                                onClick={() => handleModeChange('paged')}
                                className={`px-3 py-1.5 rounded-md transition-all ${mode === 'paged' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                レイアウト (ページ)
                            </button>
                            <button 
                                onClick={() => handleModeChange('continuous')}
                                className={`px-3 py-1.5 rounded-md transition-all ${mode === 'continuous' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                簡易表示 (連続)
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-2xl leading-none text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                <div className="p-8 overflow-auto bg-slate-200 flex-grow">
                     {/* The child is now expected to be an iframe which handles its own scrolling and content */}
                     {children}
                </div>
                 <div className="p-4 border-t bg-slate-50 flex justify-end items-center space-x-3">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md hover:bg-slate-300">
                        閉じる
                    </button>
                    <button onClick={onPrint} className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700">
                        <PrintIcon className="w-5 h-5" />
                        <span>印刷する</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;