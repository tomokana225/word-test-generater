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
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">ステップ1: 出題範囲の指定</h2>
                    <p className="text-slate-600">使用する単語帳を選択し、生成したいテストの範囲を複数指定できます。</p>
                </div>
                 <button 
                    onClick={onOpenManager}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    <span>単語帳を管理</span>
                </button>
            </div>

            {wordLists.length === 0 ? (
                <div className="text-center bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6">
                    <p className="font-semibold mb-2">単語帳がありません。</p>
                    <p>まず「単語帳を管理」ボタンから、マスターとなる単語リストを作成してください。</p>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <label htmlFor="word-list-select" className="block text-sm font-medium text-slate-700 mb-1">
                            使用する単語帳
                        </label>
                        <select
                            id="word-list-select"
                            value={activeList?.id || ''}
                            onChange={(e) => onSelectList(e.target.value)}
                            className="block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {wordLists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>
                    </div>

                    {activeList && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
                                <p>「{activeList.name}」には <span className="font-bold">{masterWordCount}</span> 個の単語が登録されています。</p>
                            </div>
                            
                            <h3 className="text-md font-semibold text-slate-800 mb-2">テスト範囲リスト</h3>
                            <div className="space-y-3">
                                {ranges.map((range, index) => (
                                    <div key={range.id} className="flex items-center space-x-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                        <input
                                            type="text"
                                            value={range.name}
                                            onChange={(e) => handleRangeChange(range.id, 'name', e.target.value)}
                                            placeholder={`テスト ${index + 1}`}
                                            className="p-2 border border-slate-300 rounded-md shadow-sm w-1/3"
                                        />
                                        <div className="flex items-center space-x-2 flex-grow">
                                            <label htmlFor={`startId-${range.id}`} className="text-sm text-slate-700">単語</label>
                                            <input
                                                type="number"
                                                id={`startId-${range.id}`}
                                                value={range.startId}
                                                onChange={(e) => handleRangeChange(range.id, 'startId', e.target.value)}
                                                placeholder="開始"
                                                className="p-2 border border-slate-300 rounded-md shadow-sm w-24"
                                                min="1"
                                            />
                                            <span className="text-slate-600">〜</span>
                                            <input
                                                type="number"
                                                id={`endId-${range.id}`}
                                                value={range.endId}
                                                onChange={(e) => handleRangeChange(range.id, 'endId', e.target.value)}
                                                placeholder="終了"
                                                className="p-2 border border-slate-300 rounded-md shadow-sm w-24"
                                                min="1"
                                            />
                                        </div>
                                        <button onClick={() => handleRemoveRange(range.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <div className="mt-4 flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200">
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="words-per-test-input" className="text-sm font-medium text-slate-700">
                                        次の範囲の単語数:
                                    </label>
                                    <input
                                        type="number"
                                        id="words-per-test-input"
                                        value={wordsPerTest}
                                        onChange={(e) => setWordsPerTest(parseInt(e.target.value, 10) || 0)}
                                        className="p-2 border border-slate-300 rounded-md shadow-sm w-24"
                                        min="1"
                                        aria-label="単語数を指定して次の範囲を追加"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddRange} 
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 border border-slate-300 shadow-sm"
                                    aria-label="指定した単語数で新しいテスト範囲を追加"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>範囲を追加</span>
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {validationError && <p className="mt-4 text-center text-red-600">{validationError}</p>}
            {error && <div className="mt-4"><ErrorDisplay error={error}/></div>}
            
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleCreateClick}
                    disabled={!canProceed}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    この内容で次へ進む
                </button>
            </div>
        </div>
    );
};

export default WordSourceSelector;