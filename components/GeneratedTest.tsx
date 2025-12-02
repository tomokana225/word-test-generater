
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
    buildContinuousPrintHtml,
    buildAnswerPrintHtml,
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
    
    // New state for Continuous Editor View
    const [isContinuousView, setIsContinuousView] = useState(false);
    
    // State for Answer Sheet
    const [answerColumns, setAnswerColumns] = useState<1 | 2>(2);

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
        
        // Calculate dimensions
        const mmToPx = 96 / 25.4;
        const dimension = PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation];
        const contentWidth = dimension.width - (pageSettings.margin * 2 * mmToPx);
        // Add a small buffer (e.g., 5px) to prevent strict boundary issues
        const maxContentHeight = dimension.height - (pageSettings.margin * 2 * mmToPx) - 5; 

        paginatorRef.current.innerHTML = documentHtml;
        const nodes = Array.from(paginatorRef.current.childNodes);
        const newPages: string[] = [];
        
        const tempPageDiv = document.createElement('div');
        tempPageDiv.style.width = `${contentWidth}px`;
        tempPageDiv.style.visibility = 'hidden';
        tempPageDiv.style.position = 'absolute'; // Prevent it from affecting flow
        // Important: mimic the editor's typography to get accurate height
        tempPageDiv.style.fontSize = `${pageSettings.fontSize}pt`;
        tempPageDiv.style.lineHeight = `${pageSettings.lineHeight}`;
        // Important: use flow-root or hidden overflow to capture child margins
        tempPageDiv.style.display = 'flow-root'; 
        
        document.body.appendChild(tempPageDiv);

        nodes.forEach(node => {
            const nodeClone = node.cloneNode(true);
            tempPageDiv.appendChild(nodeClone);
            
            // Check height
            if (tempPageDiv.getBoundingClientRect().height > maxContentHeight) {
                // If adding this node exceeds height, remove it, push current page, and start new
                tempPageDiv.removeChild(nodeClone);
                
                // If the page is empty but the single node is too big, force it in (or it will loop forever)
                if (tempPageDiv.innerHTML === '') {
                     newPages.push((node as Element).outerHTML || '');
                } else {
                     newPages.push(tempPageDiv.innerHTML);
                     tempPageDiv.innerHTML = '';
                     tempPageDiv.appendChild(nodeClone);
                }
            }
        });
        
        if (tempPageDiv.innerHTML !== '') {
            newPages.push(tempPageDiv.innerHTML);
        }
        
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
            const plainTextToCopy = pages.join('\n').replace(/<[^>]+>/g, ''); 

            const htmlBlob = new Blob([htmlToCopy], { type: 'text/html' });
            const textBlob = new Blob([plainTextToCopy], { type: 'text/plain' });

            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob,
            });

            navigator.clipboard.write([clipboardItem]).catch(err => {
                console.error('Clipboard copy failed:', err);
                navigator.clipboard.writeText(plainTextToCopy);
            });
        } catch (err) {
            console.error('Build copy content failed:', err);
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
    
    // Initial Print Handler
    const handlePrint = () => { 
        if (activeView === 'answers') {
            const finalHtml = buildAnswerPrintHtml(answersHtml, answerColumns);
            setPrintContent(finalHtml);
        } else {
            const finalHtml = buildPrintHtml(pages, elements, pageSettings); 
            setPrintContent(finalHtml); 
        }
        setIsPrintPreviewOpen(true); 
    };

    // Handler to switch modes inside the modal
    const handlePreviewModeChange = (mode: 'paged' | 'continuous') => {
        if (activeView === 'answers') return; // Answer view uses a fixed layout

        if (mode === 'paged') {
            setPrintContent(buildPrintHtml(pages, elements, pageSettings));
        } else {
            setPrintContent(buildContinuousPrintHtml(pages, elements, pageSettings));
        }
    };

    const doPrint = () => { printIframeRef.current?.contentWindow?.print(); };
    const handleSaveLayout = () => { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ savedElements: elements, savedPageSettings: pageSettings })); };
    const handleResetLayout = () => { setElements([]); setPageSettings(DEFAULT_PAGE_SETTINGS); localStorage.removeItem(LAYOUT_STORAGE_KEY); };

    // Toggle for Editor View
    const toggleContinuousView = () => setIsContinuousView(!isContinuousView);

    return (
        <div className="space-y-4">
            <Ribbon 
                formatState={{ fontName: 'sans-serif', fontSize: '12', bold: false, underline: false, strikethrough: false, align: 'left'}} 
                onAction={(cmd, val) => document.execCommand(cmd, false, val)} 
                pageSettings={pageSettings} 
                onPageSettingsChange={(s) => { setPageSettings(s); recordHistory(); }} 
                onApplyGridLayout={() => {}} 
                onAddElement={handleAddElement} 
                onSaveLayout={handleSaveLayout} 
                onResetLayout={handleResetLayout} 
                onPrint={handlePrint} 
                onCopyToClipboard={handleCopyToClipboard} 
                showFormattingMarks={showFormattingMarks} 
                onToggleFormattingMarks={() => setShowFormattingMarks(!showFormattingMarks)} 
                showGridLayout={showGridLayout} 
                onToggleGridLayout={() => setShowGridLayout(!showGridLayout)} 
                showContentBoxFrame={true} 
                onToggleContentBoxFrame={() => {}} 
            />
            
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">ステップ3: 確認・編集・印刷</h2>
            </div>
            {error && <ErrorDisplay error={error} />}

            <div className="border-b border-slate-200 flex justify-between items-center">
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
                
                {activeView === 'test' && (
                    <div className="flex items-center space-x-2 py-2">
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isContinuousView} 
                                onChange={toggleContinuousView} 
                            />
                            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ms-3 text-sm font-medium text-slate-700">ページ区切りを隠す</span>
                        </label>
                    </div>
                )}
                
                {activeView === 'answers' && (
                     <div className="flex items-center space-x-2 py-2">
                        <span className="text-sm font-medium text-slate-600">表示列数:</span>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setAnswerColumns(1)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${answerColumns === 1 ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                1列
                            </button>
                            <button
                                onClick={() => setAnswerColumns(2)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${answerColumns === 2 ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                2列
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6">
                {activeView === 'test' && (
                    <div className="bg-slate-200 p-8 overflow-x-auto min-h-[600px] rounded-lg inner-shadow" onClick={() => setActiveElementId(null)}>
                        <div ref={paginatorRef} style={{ position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' }} />
                        
                        {isContinuousView ? (
                            /* Continuous View Mode */
                            <div 
                                className="bg-white shadow-lg mx-auto relative printable-page" 
                                style={{ 
                                    width: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].width}px`, 
                                    minHeight: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].height}px`,
                                    padding: `${pageSettings.margin}mm`
                                }}
                            >
                                <div 
                                    contentEditable 
                                    suppressContentEditableWarning 
                                    dangerouslySetInnerHTML={{ __html: documentHtml }} 
                                    onInput={(e) => {
                                        setDocumentHtml(e.currentTarget.innerHTML);
                                    }}
                                    className="w-full h-full outline-none" 
                                    style={{ 
                                        fontSize: `${pageSettings.fontSize}pt`, 
                                        lineHeight: pageSettings.lineHeight 
                                    }} 
                                />
                            </div>
                        ) : (
                            /* Paged View Mode (Default) */
                            <>
                                {pages.map((pageHtml, index) => (
                                    <div key={index} className="bg-white shadow-lg mx-auto relative printable-page transition-transform hover:shadow-xl" style={{ width: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].width}px`, height: `${PAGE_DIMENSIONS[pageSettings.paperSize][pageSettings.orientation].height}px`, marginBottom: '2rem' }}>
                                        <div 
                                            ref={el => { editorRefs.current[index] = el; }} 
                                            contentEditable 
                                            suppressContentEditableWarning 
                                            onBlur={() => recordHistory()} 
                                            onInput={(e) => handleContentChange(index, e.currentTarget.innerHTML)} 
                                            dangerouslySetInnerHTML={{ __html: pageHtml }} 
                                            className="w-full h-full box-border outline-none" 
                                            style={{ 
                                                padding: `${pageSettings.margin}mm`, 
                                                fontSize: `${pageSettings.fontSize}pt`, 
                                                lineHeight: pageSettings.lineHeight 
                                            }} 
                                        />
                                        {elements.filter(el => el.pageIndex === index).map(el => (
                                            <DraggableElement key={el.id} element={el} onUpdate={handleUpdateElement} isActive={activeElementId === el.id} onActivate={setActiveElementId} onDelete={handleDeleteElement} />
                                        ))}
                                        
                                        {/* Page Number Indicator */}
                                        <div className="absolute -right-12 top-0 text-slate-400 font-bold text-xs">
                                            P.{index + 1}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
                {activeView === 'answers' && (
                    <AnswerSheet htmlContent={answersHtml} columns={answerColumns} />
                )}
            </div>
            
            {isPrintPreviewOpen && (
                <PrintPreviewModal 
                    onClose={() => setIsPrintPreviewOpen(false)} 
                    onPrint={doPrint}
                    onModeChange={handlePreviewModeChange}
                    showLayoutToggle={activeView === 'test'}
                >
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
