import React, { useState } from 'react';
import { PageStyleSettings } from '../types';
import { BoldIcon } from './icons/BoldIcon';
import { UnderlineIcon } from './icons/UnderlineIcon';
import { StrikethroughIcon } from './icons/StrikethroughIcon';
import { TextAlignLeftIcon } from './icons/TextAlignLeftIcon';
import { TextAlignCenterIcon } from './icons/TextAlignCenterIcon';
import { TextAlignRightIcon } from './icons/TextAlignRightIcon';
import { TextAlignJustifyIcon } from './icons/TextAlignJustifyIcon';
import { FontColorIcon } from './icons/FontColorIcon';
import { HighlightColorIcon } from './icons/HighlightColorIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ListNumberIcon } from './icons/ListNumberIcon';
import { ClearFormattingIcon } from './icons/ClearFormattingIcon';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { PilcrowIcon } from './icons/PilcrowIcon';
import { GridIcon } from './icons/GridIcon';
import { SquareIcon } from './icons/SquareIcon';
import { CircleIcon } from './icons/CircleIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { PrintIcon } from './icons/PrintIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { MarginIcon } from './icons/MarginIcon';

export interface FormatState {
    fontName: string;
    fontSize: string;
    bold: boolean;
    underline: boolean;
    strikethrough: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
}

interface RibbonProps {
    formatState: FormatState;
    onAction: (command: string, value?: string) => void;
    pageSettings: PageStyleSettings;
    onPageSettingsChange: (settings: PageStyleSettings) => void;
    onApplyGridLayout: () => void;
    onAddElement: (type: 'text' | 'shape', shapeType?: 'rectangle' | 'circle') => void;
    onSaveLayout: () => void;
    onResetLayout: () => void;
    onPrint: () => void;
    onCopyToClipboard: () => void;
    showFormattingMarks: boolean;
    onToggleFormattingMarks: () => void;
    showGridLayout: boolean;
    onToggleGridLayout: () => void;
    showContentBoxFrame: boolean;
    onToggleContentBoxFrame: () => void;
}

const FONT_FACES = ['sans-serif', 'serif', 'monospace', 'Arial', 'Times New Roman', 'Courier New', 'メイリオ', 'MS 明朝', 'MS ゴシック'];
const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 24, 36, 48, 72];

const Ribbon: React.FC<RibbonProps> = (props) => {
    const { formatState, onAction, pageSettings, onPageSettingsChange, onApplyGridLayout, ...restProps } = props;
    const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout'>('home');

    const handlePageSettingChange = (key: keyof PageStyleSettings, value: string | number) => {
        onPageSettingsChange({ ...pageSettings, [key]: value });
    };

    const handleMouseDown = (e: React.MouseEvent) => e.preventDefault();
    
    const renderHomeTab = () => (
        <div className="flex items-start space-x-2 p-2">
            {/* Clipboard/Undo */}
            <div className="flex flex-col space-y-1 p-1 bg-slate-50 rounded-md">
                <div className="flex items-center">
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('undo')} className="p-2 rounded hover:bg-slate-200" title="元に戻す"><UndoIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('redo')} className="p-2 rounded hover:bg-slate-200" title="やり直し"><RedoIcon className="w-5 h-5" /></button>
                </div>
            </div>
             <div className="w-px h-16 bg-slate-300 self-center"></div>
            {/* Font */}
            <div className="flex flex-col space-y-1 p-1 bg-slate-50 rounded-md">
                 <div className="flex items-center space-x-1">
                     <select value={formatState.fontName.toLowerCase()} onChange={(e) => onAction('fontName', e.target.value)} className="p-1 border border-slate-300 rounded-md text-sm w-32" onMouseDown={handleMouseDown}>
                        {FONT_FACES.map(font => <option key={font} value={font.toLowerCase()}>{font}</option>)}
                    </select>
                    <select value={Math.round(parseFloat(formatState.fontSize)) || ''} onChange={(e) => onAction('fontSize', e.target.value)} className="p-1 border border-slate-300 rounded-md text-sm w-16" onMouseDown={handleMouseDown}>
                        <option value="">- pt</option>
                        {FONT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
                <div className="flex items-center space-x-1">
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('bold')} className={`p-2 rounded ${formatState.bold ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="太字"><BoldIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('underline')} className={`p-2 rounded ${formatState.underline ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="下線"><UnderlineIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('strikeThrough')} className={`p-2 rounded ${formatState.strikethrough ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="取り消し線"><StrikethroughIcon className="w-5 h-5" /></button>
                    <div className="relative p-2 rounded hover:bg-slate-200" onMouseDown={handleMouseDown} title="文字色">
                        <FontColorIcon className="w-5 h-5" />
                        <input type="color" onChange={(e) => onAction('foreColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                     <div className="relative p-2 rounded hover:bg-slate-200" onMouseDown={handleMouseDown} title="蛍光ペン">
                        <HighlightColorIcon className="w-5 h-5" />
                        <input type="color" onChange={(e) => onAction('hiliteColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                     <button onMouseDown={handleMouseDown} onClick={() => onAction('removeFormat')} className="p-2 rounded hover:bg-slate-200" title="書式のクリア"><ClearFormattingIcon className="w-5 h-5" /></button>
                </div>
            </div>
             <div className="w-px h-16 bg-slate-300 self-center"></div>
            {/* Paragraph */}
            <div className="flex flex-col space-y-1 p-1 bg-slate-50 rounded-md">
                <div className="flex items-center space-x-1">
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('justifyLeft')} className={`p-2 rounded ${formatState.align === 'left' ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="左揃え"><TextAlignLeftIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('justifyCenter')} className={`p-2 rounded ${formatState.align === 'center' ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="中央揃え"><TextAlignCenterIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('justifyRight')} className={`p-2 rounded ${formatState.align === 'right' ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="右揃え"><TextAlignRightIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('justifyFull')} className={`p-2 rounded ${formatState.align === 'justify' ? 'bg-indigo-100' : 'hover:bg-slate-200'}`} title="両端揃え"><TextAlignJustifyIcon className="w-5 h-5" /></button>
                </div>
                 <div className="flex items-center space-x-1">
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('insertUnorderedList')} className="p-2 rounded hover:bg-slate-200" title="箇条書き"><ListBulletIcon className="w-5 h-5" /></button>
                    <button onMouseDown={handleMouseDown} onClick={() => onAction('insertOrderedList')} className="p-2 rounded hover:bg-slate-200" title="段落番号"><ListNumberIcon className="w-5 h-5" /></button>
                </div>
            </div>
             <div className="w-px h-16 bg-slate-300 self-center"></div>
             {/* Page Style */}
             <div className="flex flex-col space-y-1 p-2 bg-slate-50 rounded-md">
                 <span className="text-xs text-slate-500 text-center">ページスタイル (全体)</span>
                 <div className="flex items-center space-x-2">
                     <div className="flex items-center space-x-1" title="文書全体のデフォルトフォントサイズ">
                         <label className="text-sm">フォント:</label>
                         <input type="number" value={pageSettings.fontSize} step="0.5" onChange={(e) => handlePageSettingChange('fontSize', parseFloat(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                     </div>
                      <div className="flex items-center space-x-1" title="文書全体のデフォルト行間">
                         <label className="text-sm">行間:</label>
                         <input type="number" value={pageSettings.lineHeight} step="0.1" onChange={(e) => handlePageSettingChange('lineHeight', parseFloat(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                     </div>
                      <div className="flex items-center space-x-1" title="各問題間のスペース">
                         <label className="text-sm">問題間隔:</label>
                         <input type="number" value={pageSettings.questionSpacing} onChange={(e) => handlePageSettingChange('questionSpacing', parseInt(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                     </div>
                 </div>
             </div>
        </div>
    );

    const renderInsertTab = () => (
        <div className="flex items-center space-x-4 p-2">
             <div className="flex items-center space-x-2">
                <button onClick={() => restProps.onAddElement('text')} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-200">
                    <span className="text-xl font-serif">T</span>
                    <span>テキストボックス</span>
                </button>
            </div>
             <div className="flex items-center space-x-2">
                <button onClick={() => restProps.onAddElement('shape', 'rectangle')} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-200">
                    <SquareIcon className="w-5 h-5" />
                    <span>四角形</span>
                </button>
                 <button onClick={() => restProps.onAddElement('shape', 'circle')} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-200">
                    <CircleIcon className="w-5 h-5" />
                    <span>円</span>
                </button>
            </div>
        </div>
    );

    const renderLayoutTab = () => (
         <div className="flex items-start space-x-4 p-2">
            <div className="flex flex-col space-y-2 p-2 bg-slate-50 rounded-md">
                <span className="text-xs text-slate-500 text-center">ページ設定</span>
                <div className="flex items-center space-x-2">
                    <label className="text-sm">用紙:</label>
                    <select value={pageSettings.paperSize} onChange={(e) => handlePageSettingChange('paperSize', e.target.value)} className="p-1 border border-slate-300 rounded-md text-sm">
                        <option value="A4">A4</option>
                        <option value="B5">B5</option>
                        <option value="Letter">Letter</option>
                    </select>
                    <select value={pageSettings.orientation} onChange={(e) => handlePageSettingChange('orientation', e.target.value)} className="p-1 border border-slate-300 rounded-md text-sm">
                        <option value="portrait">縦</option>
                        <option value="landscape">横</option>
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                     <label className="text-sm">余白 (mm):</label>
                     <input type="number" value={pageSettings.margin} onChange={(e) => handlePageSettingChange('margin', parseInt(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                </div>
            </div>
            <div className="w-px h-16 bg-slate-300 self-center"></div>
             <div className="flex flex-col space-y-2 p-2 bg-slate-50 rounded-md">
                <span className="text-xs text-slate-500 text-center">グリッドレイアウト</span>
                 <div className="flex items-center space-x-2">
                     <label className="text-sm">文字数/行:</label>
                     <input type="number" value={pageSettings.charsPerLine} onChange={(e) => handlePageSettingChange('charsPerLine', parseInt(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                 </div>
                 <div className="flex items-center space-x-2">
                     <label className="text-sm">行数/ページ:</label>
                     <input type="number" value={pageSettings.linesPerPage} onChange={(e) => handlePageSettingChange('linesPerPage', parseInt(e.target.value))} className="p-1 border border-slate-300 rounded-md text-sm w-16"/>
                 </div>
                  <button onClick={onApplyGridLayout} className="text-sm font-semibold bg-indigo-100 text-indigo-700 rounded-md py-1 hover:bg-indigo-200">設定を適用</button>
            </div>
             <div className="w-px h-16 bg-slate-300 self-center"></div>
             <div className="flex flex-col space-y-2 p-2 bg-slate-50 rounded-md">
                <span className="text-xs text-slate-500 text-center">表示</span>
                <button onClick={restProps.onToggleFormattingMarks} className={`flex items-center space-x-2 p-2 rounded text-sm ${props.showFormattingMarks ? 'bg-indigo-100' : 'hover:bg-slate-200'}`}>
                    <PilcrowIcon className="w-5 h-5" />
                    <span>編集記号</span>
                </button>
                 <button onClick={restProps.onToggleGridLayout} className={`flex items-center space-x-2 p-2 rounded text-sm ${props.showGridLayout ? 'bg-indigo-100' : 'hover:bg-slate-200'}`}>
                    <GridIcon className="w-5 h-5" />
                    <span>グリッド線</span>
                </button>
                 <button onClick={restProps.onToggleContentBoxFrame} className={`flex items-center space-x-2 p-2 rounded text-sm ${props.showContentBoxFrame ? 'bg-indigo-100' : 'hover:bg-slate-200'}`}>
                    <MarginIcon className="w-5 h-5" />
                    <span>レイアウト枠</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 border border-slate-300 rounded-lg shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-300 px-2">
                <div className="flex items-center">
                    <button onClick={() => setActiveTab('home')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'home' ? 'bg-white border-x border-slate-300 -mb-px' : 'hover:bg-slate-200'}`}>ホーム</button>
                    <button onClick={() => setActiveTab('insert')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'insert' ? 'bg-white border-x border-slate-300 -mb-px' : 'hover:bg-slate-200'}`}>挿入</button>
                    <button onClick={() => setActiveTab('layout')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'layout' ? 'bg-white border-x border-slate-300 -mb-px' : 'hover:bg-slate-200'}`}>レイアウト</button>
                </div>
                 <div className="flex items-center space-x-2">
                     <button onClick={restProps.onSaveLayout} className="p-2 rounded-md hover:bg-slate-200 text-slate-700" title="現在のレイアウトを保存"><SaveIcon className="w-5 h-5" /></button>
                     <button onClick={restProps.onResetLayout} className="p-2 rounded-md hover:bg-slate-200 text-slate-700" title="レイアウトをリセット"><ArrowPathIcon className="w-5 h-5" /></button>
                     <div className="w-px h-8 bg-slate-300 mx-1"></div>
                     <button onClick={restProps.onCopyToClipboard} className="p-2 rounded-md hover:bg-slate-200 text-slate-700" title="クリップボードにコピー"><ClipboardIcon className="w-5 h-5" /></button>
                     <button onClick={restProps.onPrint} className="p-2 rounded-md hover:bg-slate-200 text-slate-700" title="印刷"><PrintIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="bg-white">
                {activeTab === 'home' && renderHomeTab()}
                {activeTab === 'insert' && renderInsertTab()}
                {activeTab === 'layout' && renderLayoutTab()}
            </div>
        </div>
    );
};

export default Ribbon;