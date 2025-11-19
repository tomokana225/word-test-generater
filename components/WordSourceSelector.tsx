import React, { useState, useEffect } from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { AppError, WordList, TestRange } from '../types';
import ErrorDisplay from './ErrorDisplay';

interface WordSourceSelectorProps {
    wordLists: WordList[];
    activeList: WordList | null;
    onSelectList: (listId: string) => void;
    onOpenManager: () => void;
    onCreateTests: (ranges: TestRange[]) => void;
    error: AppError | null;
    clearError: () => void;
}

const WordSourceSelector: React.FC<WordSourceSelectorProps> = ({ wordLists, activeList, onSelectList, onOpenManager, onCreateTests, error, clearError }) => {
    const [ranges, setRanges] = useState<TestRange[]>([
        { id: `range-${Date.now()}`, name: '小テスト 1', startId: '1', endId: '50' }
    ]);
    const [wordsPerTest, setWordsPerTest] = useState(50);
    const [validationError, setValidationError] = useState<string | null>(null);

    const masterWordCount = activeList?.words.length || 0;

    useEffect(() => {
        if (error) setValidationError(null);
    }, [error]);

    const handleAddRange = () => {
        const lastRange = ranges[ranges.length - 1];
        const nextStart = lastRange ? parseInt(lastRange.endId, 10) + 1 : 1;

        const increment = Math.max(1, wordsPerTest || 1);
        const nextEnd = nextStart + increment - 1;

        const newRange: TestRange = {
            id: `range-${Date.now()}`,
            name: `小テスト ${ranges.length + 1}`,
            startId: isNaN(nextStart) ? '' : String(nextStart),
            endId: isNaN(nextEnd) ? '' : String(masterWordCount > 0 ? Math.min(nextEnd, masterWordCount) : nextEnd),
        };
        setRanges([...ranges, newRange]);
    };

    const handleRemoveRange = (id: string) => {
        setRanges(ranges.filter(r => r.id !== id));
    };

    const handleRangeChange = (id: string, field: 'name' | 'startId' | 'endId', value: string) => {
        setRanges(ranges.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleCreateClick = () => {
        clearError();
        setValidationError(null);
        
        if (!activeList) {
            setValidationError('使用する単語帳を選択してください。');
            return;
        }

        const validRanges = ranges.filter(r => r.name.trim() && r.startId.trim() && r.endId.trim());

        if (validRanges.length === 0) {
            setValidationError('有効なテスト範囲がありません。各範囲の名前、開始・終了番号をすべて入力してください。');
            return;
        }

        for (const range of validRanges) {
            const start = parseInt(range.startId, 10);
            const end = parseInt(range.endId, 10);
            if (isNaN(start) || isNaN(end) || start < 1 || start > end) {
                setValidationError(`範囲「${range.name}」の番号が無効です。開始番号は1以上で、終了番号は開始番号以上である必要があります。`);
                return;
            }
        }
        onCreateTests(validRanges);
    };
    
    const canProceed = masterWordCount > 0 && !!activeList && ranges.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200">1</span>
                            出題範囲の指定
                        </h2>
                        <p className="text-slate-500 mt-3 ml-11 text-sm leading-relaxed">
                            ベースとなる単語帳を選択し、テストを作成したい範囲(単語番号)を指定してください。<br className="hidden sm:block"/>複数のテストを一括で生成することも可能です。
                        </p>
                    </div>
                     <button 
                        onClick={onOpenManager}
                        className="group flex items-center justify-center space-x-2 px-5 py-2.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow hover:border-indigo-200"
                    >
                        <BookOpenIcon className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span>単語帳を管理</span>
                    </button>
                </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50/30">
                {wordLists.length === 0 ? (
                    <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl group hover:border-indigo-200 transition-colors">
                        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <BookOpenIcon className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">単語帳が登録されていません</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm">
                            ExcelやCSVファイルを読み込んで、あなただけの単語リストを作成しましょう。
                        </p>
                         <button 
                            onClick={onOpenManager}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            新しい単語帳を作成
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Word List Selection Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                            <label htmlFor="word-list-select" className="block text-sm font-bold text-slate-700 mb-3">
                                使用する単語帳
                            </label>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="relative w-full">
                                    <select
                                        id="word-list-select"
                                        value={activeList?.id || ''}
                                        onChange={(e) => onSelectList(e.target.value)}
                                        className="block w-full p-4 pr-10 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-slate-800 appearance-none cursor-pointer hover:bg-slate-100"
                                    >
                                        {wordLists.map(list => (
                                            <option key={list.id} value={list.id}>{list.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {activeList && (
                                    <div className="flex-shrink-0 whitespace-nowrap px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium border border-indigo-100 flex items-center gap-3">
                                        <span className="text-2xl font-bold leading-none">{masterWordCount}</span>
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">WORDS</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {activeList && (
                            <>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-5 gap-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                        テスト範囲の設定
                                    </h3>
                                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                        <span className="text-xs font-bold text-slate-500">自動入力:</span>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={wordsPerTest}
                                                onChange={(e) => setWordsPerTest(parseInt(e.target.value, 10) || 0)}
                                                className="w-16 p-1 text-center text-sm font-bold text-slate-800 outline-none border-b-2 border-indigo-100 focus:border-indigo-500 bg-transparent transition-colors"
                                                min="1"
                                            />
                                            <span className="text-xs text-slate-500 ml-2">単語 / 回</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                                    {ranges.map((range, index) => (
                                        <div key={range.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 relative group">
                                            <div className="mb-4">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">テスト名</label>
                                                <input
                                                    type="text"
                                                    value={range.name}
                                                    onChange={(e) => handleRangeChange(range.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                                    placeholder={`テスト ${index + 1}`}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">開始番号</label>
                                                    <input
                                                        type="number"
                                                        value={range.startId}
                                                        onChange={(e) => handleRangeChange(range.id, 'startId', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-center"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="text-slate-300 pt-5 flex justify-center">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">終了番号</label>
                                                    <input
                                                        type="number"
                                                        value={range.endId}
                                                        onChange={(e) => handleRangeChange(range.id, 'endId', e.target.value)}
                                                        className="w-full px-3 py-2 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-center"
                                                        min="1"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {ranges.length > 1 && (
                                                <button 
                                                    onClick={() => handleRemoveRange(range.id)}
                                                    className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:rotate-90 transform duration-200"
                                                    title="削除"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={handleAddRange}
                                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all h-full min-h-[160px] gap-3 group cursor-pointer"
                                    >
                                        <div className="bg-slate-100 p-3 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-110">
                                            <PlusIcon className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="font-bold block">範囲を追加</span>
                                            <span className="text-xs text-slate-400 group-hover:text-indigo-500 mt-1 block">次の {wordsPerTest} 語を自動設定</span>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {validationError && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium mb-6 text-center animate-pulse flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {validationError}
                    </div>
                )}
                {error && <div className="mb-6"><ErrorDisplay error={error}/></div>}
                
                <div className="mt-4 flex justify-end border-t border-slate-200 pt-6">
                    <button
                        onClick={handleCreateClick}
                        disabled={!canProceed}
                        className="px-10 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none transition-all flex items-center gap-2"
                    >
                        <span>次のステップへ</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WordSourceSelector;