import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
    GeneratedTestData,
    AppError,
    PageStyleSettings,
    DraggableElementData,
} from '../types';
import {
    buildTestBatchHtml,
    buildAnswerSheetBatchHtml,
    buildPrintHtml,
    buildCopyableHtml,
} from '../utils/htmlBuilders';
import Ribbon from './Ribbon';
import DraggableElement from './DraggableElement';
import PrintPreviewModal from './PrintPreviewModal';
import AnswerSheet from './AnswerSheet';
import ErrorDisplay from './ErrorDisplay';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

const DEFAULT_PAGE_SETTINGS: PageStyleSettings = {
    fontSize: 10.5,
    margin: 20,
    lineHeight: 1.5,
    questionSpacing: 10,
    orientation: 'portrait',
    paperSize: 'A4',
    charsPerLine: 40,
    linesPerPage: 35,
};

const PAGE_DIMENSIONS = {
    A4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
    B5: { portrait: { width: 693, height: 984 }, landscape: { width: 984, height: 693 } },
    Letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
};

const LAYOUT_STORAGE_KEY = 'editorLayoutSettings';

interface GeneratedTestProps {
    testBatch: GeneratedTestData[];
    onRestart: () => void;
    error: AppError | null;
}

interface HistoryState {
    documentHtml: string;
    elements: DraggableElementData[];
    pageSettings: PageStyleSettings;
}

const GeneratedTest: React.FC<GeneratedTestProps> = ({ testBatch, onRestart, error }) => {
    const [documentHtml, setDocumentHtml] = useState('');
    const [answersHtml, setAnswersHtml] = useState('');
    const [pages, setPages] = useState<string[]>(['']);
    const [pageSettings, setPageSettings] = useState<PageStyleSettings>(DEFAULT_PAGE_SETTINGS);
    const [elements, setElements] = useState<DraggableElementData[]>([]);
    const [activeElementId, setActiveElementId] = useState<string | null>(null);

    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // UI States
    const [activeView, setActiveView] = useState<'test' | 'answers'>('test');
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [printContent, setPrintContent] = useState('');
    const [showFormattingMarks, setShowFormattingMarks] = useState(false);
    const [showGridLayout, setShowGridLayout] = useState(false);

    const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
    const paginatorRef = useRef<HTMLDivElement>(null);
    const printIframeRef = useRef<HTMLIFrameElement>(null);
    const isRecordingHistory = useRef(true);

    const recordHistory = useCallback(() => {
        if (!isRecordingHistory.current) return;
        const newHistory = history.slice(0, historyIndex + 1);
        const currentState = { documentHtml, elements, pageSettings };
        setHistory([...newHistory, currentState]);
        setHistoryIndex(newHistory.length);
    }, [documentHtml, elements, pageSettings, history, historyIndex]);

    useEffect(() => {
        try {
            const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
            if (savedLayout) {
                const { savedElements, savedPageSettings } = JSON.parse(savedLayout);
                if (savedElements) setElements(savedElements);
                if (savedPageSettings) setPageSettings(savedPageSettings);
            }
        } catch (e) { console.error("Failed to load layout from localStorage", e); }

        if (testBatch.length > 0) {
            const newTestHtml = buildTestBatchHtml(testBatch);
            const newAnswersHtml = buildAnswerSheetBatchHtml(testBatch);
            setDocumentHtml(newTestHtml);
            setAnswersHtml(newAnswersHtml);

            isRecordingHistory.current = false;
            setHistory([{ documentHtml: newTestHtml, elements, pageSettings }]);
            setHistoryIndex(0);
            setTimeout(() => isRecordingHistory.current = true, 100);
        }
    }, [testBatch]);
    
    const paginateContent = useCallback(() => {
        if (!paginatorRef.current || !documentHtml) return;
        const pageHeight = PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].height - (pageSettings.margin * 2 * (96 / 25.4));
        paginatorRef.current.innerHTML = documentHtml;
        const nodes = Array.from(paginatorRef.current.childNodes);
        const newPages: string[] = [];
        const tempPageDiv = document.createElement('div');
        tempPageDiv.style.width = `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].width - (pageSettings.margin * 2 * (96 / 25.4))}px`;
        tempPageDiv.style.visibility = 'hidden';
        document.body.appendChild(tempPageDiv);

        nodes.forEach(node => {
            const nodeClone = node.cloneNode(true);
            tempPageDiv.appendChild(nodeClone);
            if (tempPageDiv.offsetHeight > pageHeight) {
                tempPageDiv.removeChild(nodeClone);
                newPages.push(tempPageDiv.innerHTML);
                tempPageDiv.innerHTML = '';
                tempPageDiv.appendChild(nodeClone);
            }
        });
        
        newPages.push(tempPageDiv.innerHTML);
        document.body.removeChild(tempPageDiv);
        setPages(newPages.length > 0 ? newPages : ['']);
        editorRefs.current = newPages.map(() => null);
    }, [documentHtml, pageSettings]);

    useLayoutEffect(() => { paginateContent(); }, [paginateContent]);

    const handleContentChange = (pageIndex: number, newHtml: string) => {
        const newPages = [...pages];
        newPages[pageIndex] = newHtml;
        setDocumentHtml(newPages.join(''));
        recordHistory();
    };
    
    const handleCopyToClipboard = useCallback(() => {
        try {
            const htmlToCopy = buildCopyableHtml(pages, elements, pageSettings);
            // Plain text version should use a single newline to avoid extra spaces.
            const plainTextToCopy = pages.join('\n'); 

            const htmlBlob = new Blob([htmlToCopy], { type: 'text/html' });
            const textBlob = new Blob([plainTextToCopy], { type: 'text/plain' });

            // Use the Clipboard API to write both rich text and a plain text fallback.
            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob,
            });

            navigator.clipboard.write([clipboardItem]).catch(err => {
                console.error('クリップボードへのコピーに失敗しました。テキストとしてフォールバックします。:', err);
                // Fallback for browsers that might not support rich text copy well.
                navigator.clipboard.writeText(plainTextToCopy);
            });
        } catch (err) {
            console.error('コピー用のコンテンツのビルド中にエラーが発生しました:', err);
        }
    }, [pages, elements, pageSettings]);

    const handleAddElement = (type: 'text' | 'shape', shapeType?: 'rectangle' | 'circle') => {
        const newElement: DraggableElementData = {
            id: `el-${Date.now()}`, x: 50, y: 50, width: 200, height: type === 'text' ? 40 : 100,
            content: type === 'text' ? '新しいテキスト' : '', isEditing: type === 'text', type, shapeType,
            styles: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000', backgroundColor: type === 'shape' ? '#ffffff' : undefined, borderColor: type === 'shape' ? '#000000' : undefined, borderWidth: type === 'shape' ? 1 : 0 },
            pageIndex: 0,
        };
        setElements([...elements, newElement]); setActiveElementId(newElement.id); recordHistory();
    };
    const handleUpdateElement = (id: string, updates: Partial<DraggableElementData>) => { setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el)); };
    const handleDeleteElement = (id: string) => { setElements(elements.filter(el => el.id !== id)); recordHistory(); };
    const handlePrint = () => { const finalHtml = buildPrintHtml(pages, elements, pageSettings); setPrintContent(finalHtml); setIsPrintPreviewOpen(true); };
    const doPrint = () => { printIframeRef.current?.contentWindow?.print(); };
    const handleSaveLayout = () => { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ savedElements: elements, savedPageSettings: pageSettings })); };
    const handleResetLayout = () => { setElements([]); setPageSettings(DEFAULT_PAGE_SETTINGS); localStorage.removeItem(LAYOUT_STORAGE_KEY); };

    return (
        <div className="space-y-4">
            <Ribbon formatState={{ fontName: 'sans-serif', fontSize: '12', bold: false, underline: false, strikethrough: false, align: 'left'}} onAction={(cmd, val) => document.execCommand(cmd, false, val)} pageSettings={pageSettings} onPageSettingsChange={(s) => { setPageSettings(s); recordHistory(); }} onApplyGridLayout={() => {}} onAddElement={handleAddElement} onSaveLayout={handleSaveLayout} onResetLayout={handleResetLayout} onPrint={handlePrint} onCopyToClipboard={handleCopyToClipboard} showFormattingMarks={showFormattingMarks} onToggleFormattingMarks={() => setShowFormattingMarks(!showFormattingMarks)} showGridLayout={showGridLayout} onToggleGridLayout={() => setShowGridLayout(!showGridLayout)} showContentBoxFrame={true} onToggleContentBoxFrame={() => {}} />
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">ステップ3: 確認・編集・印刷</h2>
            </div>
            {error && <ErrorDisplay error={error} />}

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveView('test')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'test'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        問題
                    </button>
                    <button
                        onClick={() => setActiveView('answers')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeView === 'answers'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        解答
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {activeView === 'test' && (
                    <div className="bg-slate-200 p-8 overflow-x-auto" onClick={() => setActiveElementId(null)}>
                        <div ref={paginatorRef} style={{ position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' }} />
                        {pages.map((pageHtml, index) => (
                            <div key={index} className="bg-white shadow-lg mx-auto relative printable-page" style={{ width: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].width}px`, height: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].height}px`, marginBottom: '1rem' }}>
                                <div ref={el => { editorRefs.current[index] = el; }} contentEditable suppressContentEditableWarning onBlur={() => recordHistory()} onInput={(e) => handleContentChange(index, e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: pageHtml }} className="w-full h-full box-border outline-none" style={{ padding: `${pageSettings.margin}mm`, fontSize: `${pageSettings.fontSize}pt`, lineHeight: pageSettings.lineHeight }} />
                                {elements.filter(el => el.pageIndex === index).map(el => (
                                    <DraggableElement key={el.id} element={el} onUpdate={handleUpdateElement} isActive={activeElementId === el.id} onActivate={setActiveElementId} onDelete={handleDeleteElement} />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                {activeView === 'answers' && (
                    <AnswerSheet htmlContent={answersHtml} />
                )}
            </div>
            
            {isPrintPreviewOpen && (
                <PrintPreviewModal onClose={() => setIsPrintPreviewOpen(false)} onPrint={doPrint}>
                    <iframe ref={printIframeRef} srcDoc={printContent} title="Print Preview" className="w-full h-full border-0" />
                </PrintPreviewModal>
            )}

            <div className="mt-8 flex justify-between">
                <button onClick={onRestart} className="flex items-center space-x-2 px-6 py-2 bg-slate-600 text-white font-semibold rounded-md shadow-sm hover:bg-slate-700">
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>最初からやり直す</span>
                </button>
            </div>
        </div>
    );
};

export default GeneratedTest;