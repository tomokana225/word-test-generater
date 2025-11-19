import React from 'react';
import { DraggableElementData, ElementStyles } from '../types';
import { BoldIcon } from './icons/BoldIcon';
import { UnderlineIcon } from './icons/UnderlineIcon';
import { TextColorIcon } from './icons/TextColorIcon';
import { TextAlignLeftIcon } from './icons/TextAlignLeftIcon';
import { TextAlignCenterIcon } from './icons/TextAlignCenterIcon';
import { TextAlignRightIcon } from './icons/TextAlignRightIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ElementToolbarProps {
    element: DraggableElementData;
    onStateChange: (newState: Partial<ElementStyles>) => void;
    onDelete: () => void;
}

const ElementToolbar: React.FC<ElementToolbarProps> = ({ element, onStateChange, onDelete }) => {
    
    const handleStyleChange = (key: keyof ElementStyles, value: any) => {
        onStateChange({ [key]: value });
    };

    const handleFontSizeChange = (delta: number) => {
        onStateChange({ fontSize: Math.max(8, (element.styles.fontSize || 12) + delta) });
    };
    
    const handleBorderWidthChange = (delta: number) => {
        onStateChange({ borderWidth: Math.max(0, (element.styles.borderWidth || 0) + delta) });
    };

    const styles = element.styles;

    return (
        <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-md shadow-lg border border-slate-200 flex items-center p-1 space-x-1 z-20 no-print"
            onMouseDown={(e) => e.stopPropagation()}
        >
           
           {element.type === 'text' && (
             <>
                {/* Font Size */}
                <button onClick={() => handleFontSizeChange(-1)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                    <span className="text-xs font-semibold">A-</span>
                </button>
                <span className="text-sm font-semibold w-6 text-center">{styles.fontSize}</span>
                <button onClick={() => handleFontSizeChange(1)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                    <span className="text-xs font-semibold">A+</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                {/* Bold */}
                <button
                    onClick={() => handleStyleChange('fontWeight', styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`p-2 rounded hover:bg-slate-100 ${styles.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
                >
                    <BoldIcon className="w-5 h-5" />
                </button>
                {/* Underline */}
                <button
                    onClick={() => handleStyleChange('textDecoration', styles.textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`p-2 rounded hover:bg-slate-100 ${styles.textDecoration === 'underline' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
                >
                    <UnderlineIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                {/* Text Align */}
                <button onClick={() => handleStyleChange('textAlign', 'left')} className={`p-2 rounded hover:bg-slate-100 ${styles.textAlign === 'left' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}> <TextAlignLeftIcon className="w-5 h-5" /> </button>
                <button onClick={() => handleStyleChange('textAlign', 'center')} className={`p-2 rounded hover:bg-slate-100 ${styles.textAlign === 'center' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}> <TextAlignCenterIcon className="w-5 h-5" /> </button>
                <button onClick={() => handleStyleChange('textAlign', 'right')} className={`p-2 rounded hover:bg-slate-100 ${styles.textAlign === 'right' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}> <TextAlignRightIcon className="w-5 h-5" /> </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                
                {/* Color Picker */}
                <div className="relative p-2 rounded hover:bg-slate-100">
                    <TextColorIcon className="w-5 h-5" style={{ color: styles.color }} />
                    <input type="color" value={styles.color} onChange={(e) => handleStyleChange('color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
            </>
           )}

           {element.type === 'shape' && (
            <>
                {/* Fill Color */}
                <div className="relative p-2 rounded hover:bg-slate-100" title="Fill Color">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: styles.backgroundColor, border: '1px solid #ccc' }}></div>
                    <input type="color" value={styles.backgroundColor} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
                 {/* Border Color */}
                <div className="relative p-2 rounded hover:bg-slate-100" title="Border Color">
                     <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: styles.borderColor }}></div>
                    <input type="color" value={styles.borderColor} onChange={(e) => handleStyleChange('borderColor', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                {/* Border Width */}
                <button onClick={() => handleBorderWidthChange(-1)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                    <span className="text-xs font-semibold">W-</span>
                </button>
                <span className="text-sm font-semibold w-6 text-center">{styles.borderWidth}</span>
                <button onClick={() => handleBorderWidthChange(1)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                    <span className="text-xs font-semibold">W+</span>
                </button>
            </>
           )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onDelete} className="p-2 rounded hover:bg-red-100 text-red-600" title="要素を削除">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ElementToolbar;