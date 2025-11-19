import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { WordPair, WordList } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface WordListManagerModalProps {
    onClose: () => void;
    onUpdateLists: (lists: WordList[]) => void;
    initialLists: WordList[];
}

const EditableCell: React.FC<{ value: string; onChange: (newValue: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
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
                className="w-full px-2 py-1 border border-indigo-500 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={placeholder}
            />
        );
    }
    return (
        <div onClick={() => setIsEditing(true)} className="w-full h-full px-2 py-1 cursor-pointer hover:bg-indigo-50 rounded text-slate-700 min-h-[1.5em]">
            {value || <span className="text-slate-300 italic text-xs">{placeholder || 'Empty'}</span>}
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

    const handleDeleteList = (listId: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
            setError('有効なデータが見つかりませんでした。1列目に番号(数字)、2列目に英単語、3列目に訳が必要です。');
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

    const handlePaste = useCallback(async (mode: 'replace' | 'add') => {
        setIsLoading(true);
        setError(null);
        try {
            const pastedText = await navigator.clipboard.readText();
             if (!pastedText) {
                 setError('クリップボードが空です。');
                 return;
             }
            const rows = pastedText.split('\n').map(line => line.split(/[\t,]/));
            parseAndLoad(rows, mode);
        } catch(err) {
            console.error(err);
            setError('クリップボードからの読み込みに失敗しました。許可設定を確認してください。');
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden border border-slate-700">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                         <div className="bg-indigo-600 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                         </div>
                        <h2 className="text-xl font-bold text-slate-800">マスター単語帳の管理</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow flex min-h-0">
                    {/* Left Panel: Sidebar List Management */}
                    <div className="w-64 md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewList()}
                                    placeholder="新しい単語帳..."
                                    className="flex-grow px-3 py-2 border border-slate-300 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                                <button 
                                    onClick={handleAddNewList} 
                                    disabled={!newListName.trim()}
                                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-1">
                            {lists.map(list => (
                                <div 
                                    key={list.id} 
                                    onClick={() => setSelectedListId(list.id)}
                                    className={`group flex justify-between items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedListId === list.id ? 'bg-white shadow-sm border border-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200/50'}`}
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedListId === list.id ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                        <span className="truncate text-sm font-medium">{list.name}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDeleteList(list.id, e)} 
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                        title="削除"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {lists.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm px-4">
                                    単語帳がありません。<br/>上部の入力欄から作成してください。
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Word Management */}
                    <div className="flex-grow flex flex-col min-h-0 bg-white relative">
                        {selectedList ? (
                            <>
                                <div className="p-4 border-b border-slate-100 flex flex-col space-y-4">
                                    <div className="flex items-center justify-between">
                                        <input
                                            type="text"
                                            value={selectedList.name}
                                            onChange={(e) => handleRenameList(selectedList.id, e.target.value)}
                                            className="text-xl font-bold text-slate-800 px-2 py-1 -ml-2 rounded border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 outline-none transition-all bg-transparent w-1/2"
                                        />
                                        <div className="text-sm text-slate-500">
                                            <span className="font-medium text-indigo-600">{selectedList.words.length}</span> 語
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider">Import</span>
                                        <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                        
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                            <UploadIcon className="w-3.5 h-3.5" />
                                            <span>ファイル (Excel/CSV)</span>
                                        </button>
                                        <button onClick={() => handlePaste('replace')} className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                            <ClipboardIcon className="w-3.5 h-3.5" />
                                            <span>貼り付けて上書き</span>
                                        </button>
                                        <button onClick={() => handlePaste('add')} className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            <span>貼り付けて追加</span>
                                        </button>
                                        
                                        <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) handleFile(e.target.files[0], 'replace'); }} className="hidden" accept=".xlsx, .xls, .csv" />
                                    </div>
                                    {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded">{error}</div>}
                                </div>

                                <div className="flex-grow overflow-y-auto relative">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-2 w-20 border-b border-slate-200 text-center">No.</th>
                                                <th className="px-4 py-2 w-5/12 border-b border-slate-200">単語 (English)</th>
                                                <th className="px-4 py-2 w-5/12 border-b border-slate-200">意味 (日本語)</th>
                                                <th className="px-4 py-2 w-10 border-b border-slate-200"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedList.words.map((word) => (
                                                <tr key={word.id} className="hover:bg-slate-50 group">
                                                    <td className="px-2 py-1 text-center">
                                                        <EditableCell value={word.id} onChange={(v) => handleWordChange(word.id, 'id', v)} placeholder="#" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <EditableCell value={word.word} onChange={(v) => handleWordChange(word.id, 'word', v)} placeholder="Word" />
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <EditableCell value={word.translation} onChange={(v) => handleWordChange(word.id, 'translation', v)} placeholder="Translation" />
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
                                                        <button onClick={() => handleDeleteWord(word.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {selectedList.words.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-12 text-slate-400 italic">
                                                        単語が登録されていません。<br/>ファイルから読み込むか、下のボタンで追加してください。
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                 <div className="p-4 border-t border-slate-200 bg-slate-50">
                                    <button onClick={handleAddNewWord} className="flex items-center justify-center space-x-2 w-full py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition-all">
                                        <PlusIcon className="w-4 h-4" /><span>単語を行に追加</span>
                                    </button>
                                 </div>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <BookOpenIcon className="w-16 h-16 opacity-20" />
                                <p>左側のリストから単語帳を選択してください</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                        キャンセル
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:shadow-md disabled:bg-slate-300 disabled:shadow-none transition-all"
                    >
                        変更を保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WordListManagerModal;