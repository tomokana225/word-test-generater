import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { WordPair, WordList } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface WordListManagerModalProps {
    onClose: () => void;
    onUpdateLists: (lists: WordList[]) => void;
    initialLists: WordList[];
}

const EditableCell: React.FC<{ value: string; onChange: (newValue: string) => void; }> = ({ value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        onChange(currentValue);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                className="w-full p-1 border border-indigo-500 rounded-md bg-white"
            />
        );
    }
    return (
        <div onClick={() => setIsEditing(true)} className="w-full h-full p-1 cursor-pointer hover:bg-slate-100 rounded-md">
            {value}
        </div>
    );
};

const WordListManagerModal: React.FC<WordListManagerModalProps> = ({ onClose, onUpdateLists, initialLists }) => {
    const [lists, setLists] = useState<WordList[]>(initialLists);
    const [selectedListId, setSelectedListId] = useState<string | null>(initialLists[0]?.id || null);
    const [newListName, setNewListName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedList = lists.find(l => l.id === selectedListId);

    const handleAddNewList = () => {
        if (!newListName.trim()) return;
        const newList: WordList = {
            id: `list-${Date.now()}`,
            name: newListName.trim(),
            createdAt: new Date().toISOString(),
            words: [],
        };
        const updatedLists = [...lists, newList];
        setLists(updatedLists);
        setSelectedListId(newList.id);
        setNewListName('');
    };

    const handleDeleteList = (listId: string) => {
        if (window.confirm('この単語帳を削除しますか？この操作は元に戻せません。')) {
            const updatedLists = lists.filter(l => l.id !== listId);
            setLists(updatedLists);
            if (selectedListId === listId) {
                setSelectedListId(updatedLists[0]?.id || null);
            }
        }
    };
    
    const handleRenameList = (listId: string, newName: string) => {
        setLists(lists.map(l => l.id === listId ? { ...l, name: newName } : l));
    };

    const updateWordsInSelectedList = useCallback((newWords: WordPair[], mode: 'replace' | 'add') => {
        if (!selectedListId) return;

        setLists(currentLists => {
            return currentLists.map(list => {
                if (list.id === selectedListId) {
                    let updatedWordList: WordPair[];
                    if (mode === 'replace') {
                        updatedWordList = newWords;
                    } else {
                        const existingIds = new Set(list.words.map(w => w.id));
                        const wordsToAdd = newWords.filter(w => !existingIds.has(w.id));
                        updatedWordList = [...list.words, ...wordsToAdd];
                    }
                    updatedWordList.sort((a, b) => Number(a.id) - Number(b.id));
                    return { ...list, words: updatedWordList };
                }
                return list;
            });
        });
    }, [selectedListId]);
    
    const parseAndLoad = useCallback((data: any[][], mode: 'replace' | 'add') => {
        if (data.length === 0) {
            setError('ファイルが空か、読み取れませんでした。');
            return;
        }
        const wordPairs: WordPair[] = data.map(row => ({
            id: String(row[0] || '').trim(),
            word: String(row[1] || '').trim(),
            translation: String(row[2] || '').trim(),
        })).filter(pair => pair.id && !isNaN(Number(pair.id)) && pair.word && pair.translation);
        
        if (wordPairs.length === 0) {
            setError('有効なデータが見つかりませんでした。1列目に単語番号(数字)、2列目に英単語、3列目に訳があることを確認してください。');
            return;
        }

        updateWordsInSelectedList(wordPairs, mode);
        setError(null);
    }, [updateWordsInSelectedList]);

    const handleFile = useCallback(async (file: File, mode: 'replace' | 'add') => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            parseAndLoad(json as any[][], mode);
        } catch (err) {
            setError('ファイルの解析に失敗しました。ExcelまたはCSV形式であることを確認してください。');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [parseAndLoad]);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>, mode: 'replace' | 'add') => {
        setIsLoading(true);
        setError(null);
        try {
            const pastedText = event.clipboardData.getData('text');
            const rows = pastedText.split('\n').map(line => line.split(/[\t,]/));
            parseAndLoad(rows, mode);
        } catch(err) {
            setError('貼り付けたテキストの解析に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    }, [parseAndLoad]);
    
    const handleWordChange = (wordId: string, field: keyof WordPair, value: string) => {
        if (!selectedList) return;
        const updatedWords = selectedList.words.map(w => 
            w.id === wordId ? { ...w, [field]: value } : w
        );
        setLists(lists.map(l => l.id === selectedListId ? { ...l, words: updatedWords } : l));
    };
    
    const handleAddNewWord = () => {
        if (!selectedList) return;
        const existingIds = selectedList.words.map(w => Number(w.id)).filter(id => !isNaN(id));
        const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        const newWord: WordPair = { id: String(newId), word: '', translation: '' };
        
        const updatedWords = [...selectedList.words, newWord];
        setLists(lists.map(l => l.id === selectedListId ? { ...l, words: updatedWords } : l));
    };
    
    const handleDeleteWord = (wordId: string) => {
        if (!selectedList) return;
        const updatedWords = selectedList.words.filter(w => w.id !== wordId);
        setLists(lists.map(l => l.id === selectedListId ? { ...l, words: updatedWords } : l));
    };

    const handleSave = () => {
        onUpdateLists(lists);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">マスター単語帳の管理</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200">
                        <XMarkIcon className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
                
                <div className="flex-grow flex space-x-6 min-h-0">
                    {/* Left Panel: List Management */}
                    <div className="w-1/3 flex flex-col border-r border-slate-200 pr-4">
                        <div className="flex space-x-2 mb-4">
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNewList()}
                                placeholder="新しい単語帳名"
                                className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm"
                            />
                            <button onClick={handleAddNewList} className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-1">
                            {lists.map(list => (
                                <div key={list.id} className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedListId === list.id ? 'bg-indigo-100 font-semibold' : 'hover:bg-slate-100'}`}>
                                    <span onClick={() => setSelectedListId(list.id)} className="truncate flex-grow">{list.name}</span>
                                    <button onClick={() => handleDeleteList(list.id)} className="ml-2 p-1 text-slate-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Word Management */}
                    <div className="w-2/3 flex flex-col min-h-0">
                        {selectedList ? (
                            <>
                                <input
                                    type="text"
                                    value={selectedList.name}
                                    onChange={(e) => handleRenameList(selectedList.id, e.target.value)}
                                    className="text-lg font-bold p-1 -ml-1 mb-2 rounded-md hover:bg-slate-100 focus:bg-white focus:ring-2"
                                />
                                <div className="mb-4">
                                    <p className="text-sm text-slate-600 mb-2">ファイルやテキストを読み込んで、単語を<span className="font-bold">上書き</span>または<span className="font-bold">追加</span>します。</p>
                                    <div className="flex space-x-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-200 flex items-center justify-center space-x-2">
                                            <UploadIcon className="w-4 h-4" />
                                            <span>ファイルから読み込み</span>
                                        </button>
                                        <textarea onPaste={(e) => handlePaste(e, 'replace')} placeholder="ここに貼り付け (上書き)" rows={1} className="flex-1 p-2 border rounded-md text-sm" />
                                        <textarea onPaste={(e) => handlePaste(e, 'add')} placeholder="ここに貼り付け (追加)" rows={1} className="flex-1 p-2 border rounded-md text-sm" />
                                        <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFile(e.target.files[0], 'replace'); }} className="hidden" accept=".xlsx, .xls, .csv" />
                                    </div>
                                    {error && <p className="mt-2 text-center text-red-600">{error}</p>}
                                </div>
                                <div className="flex-grow overflow-y-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="p-2 w-1/6">番号</th>
                                                <th className="p-2 w-2/5">単語</th>
                                                <th className="p-2 w-2/5">訳</th>
                                                <th className="p-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedList.words.map(word => (
                                                <tr key={word.id} className="border-b border-slate-200">
                                                    <td className="p-0"><EditableCell value={word.id} onChange={(v) => handleWordChange(word.id, 'id', v)} /></td>
                                                    <td className="p-0"><EditableCell value={word.word} onChange={(v) => handleWordChange(word.id, 'word', v)} /></td>
                                                    <td className="p-0"><EditableCell value={word.translation} onChange={(v) => handleWordChange(word.id, 'translation', v)} /></td>
                                                    <td className="p-1 text-center"><button onClick={() => handleDeleteWord(word.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                 <button onClick={handleAddNewWord} className="mt-2 flex items-center justify-center space-x-2 w-full py-2 bg-slate-100 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-200">
                                     <PlusIcon className="w-4 h-4" /><span>単語を追加</span>
                                 </button>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-slate-500">
                                <p>単語帳を選択するか、新しい単語帳を作成してください。</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 rounded-md text-slate-700 font-semibold hover:bg-slate-100">
                        キャンセル
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="py-2 px-4 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-slate-400"
                    >
                        保存して閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WordListManagerModal;