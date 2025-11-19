import React from 'react';
import { BoldIcon } from './icons/BoldIcon';
import { TextAlignLeftIcon } from './icons/TextAlignLeftIcon';
import { TextAlignCenterIcon } from './icons/TextAlignCenterIcon';
import { TextAlignRightIcon } from './icons/TextAlignRightIcon';

const DocumentEditorToolbar: React.FC = () => {
    
    const applyCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    return (
        <div className="flex items-center p-1 bg-slate-100 rounded-t-lg border border-b-0 border-slate-300 space-x-1 sticky top-0 z-10">
            <button
                onClick={() => applyCommand('bold')}
                className="p-2 rounded hover:bg-slate-200 text-slate-700"
                title="太字 (Ctrl+B)"
            >
                <BoldIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button
                onClick={() => applyCommand('justifyLeft')}
                className="p-2 rounded hover:bg-slate-200 text-slate-700"
                title="左揃え"
            >
                <TextAlignLeftIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => applyCommand('justifyCenter')}
                className="p-2 rounded hover:bg-slate-200 text-slate-700"
                title="中央揃え"
            >
                <TextAlignCenterIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => applyCommand('justifyRight')}
                className="p-2 rounded hover:bg-slate-200 text-slate-700"
                title="右揃え"
            >
                <TextAlignRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default DocumentEditorToolbar;
