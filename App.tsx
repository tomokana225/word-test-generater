
import { useState, useEffect } from 'react';
import ModeSelector from './components/ModeSelector';
import WordSourceSelector from './components/WordSourceSelector';
import TestConfigurator from './components/TestConfigurator';
import GeneratedTest from './components/GeneratedTest';
import ProgressDisplay from './components/ProgressDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import SettingsModal from './components/SettingsModal';
import Stepper from './components/Stepper';
import WordListManagerModal from './components/WordListManagerModal';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { useApiKey } from './contexts/ApiKeyContext';
import { generateTest, generateListeningTest } from './services/geminiService';
import type { QuestionConfig, AppError, WordList, TestRange, GeneratedTestData, ListeningConfig } from './types';

const VOCABULARY_LISTS_KEY = 'vocabularyLists';
const QUESTION_CONFIG_KEY = 'questionConfig';

const DEFAULT_CONFIG: QuestionConfig = {
    translation: 2,
    reverseTranslation: 2,
    multipleChoice: 3,
    fillInTheBlank: 3,
    synonym: 0,
    antonym: 0,
};

const DEFAULT_LISTENING_CONFIG: ListeningConfig = {
    difficulty: 'jh2', // Default to Junior High 2
    grammarPoints: [],
    questionCount: 5,
    includeIllustrations: false,
    testCount: 1,
    theme: ''
};

function App() {
    // Step 0: Mode Selection, 1: Word Source, 2: Config, 3: Generated
    const [step, setStep] = useState(0); 
    const [wordLists, setWordLists] = useState<WordList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [testRanges, setTestRanges] = useState<TestRange[]>([]);
    const [config, setConfig] = useState<QuestionConfig>(() => {
        try {
            const savedConfig = localStorage.getItem(QUESTION_CONFIG_KEY);
            if (savedConfig) {
                return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
            }
        } catch (e) {
            console.error("Failed to load question config from localStorage", e);
        }
        return DEFAULT_CONFIG;
    });
    
    // Listening Config State
    const [testMode, setTestMode] = useState<'vocabulary' | 'listening'>('vocabulary');
    const [listeningConfig, setListeningConfig] = useState<ListeningConfig>(DEFAULT_LISTENING_CONFIG);

    const [testBatchData, setTestBatchData] = useState<GeneratedTestData[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<AppError | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isWordManagerOpen, setIsWordManagerOpen] = useState(false);

    const { apiKey, isApiKeyValid } = useApiKey();
    
    useEffect(() => {
        try {
            const savedLists = localStorage.getItem(VOCABULARY_LISTS_KEY);
            if (savedLists) {
                const parsedLists: WordList[] = JSON.parse(savedLists);
                parsedLists.forEach(list => list.words.sort((a, b) => Number(a.id) - Number(b.id)));
                setWordLists(parsedLists);
                 if (parsedLists.length > 0) {
                    setActiveListId(prevId => prevId || parsedLists[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load or parse word lists from localStorage", e);
            setWordLists([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(QUESTION_CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.error("Failed to save question config to localStorage", e);
        }
    }, [config]);

    const handleListsUpdate = (updatedLists: WordList[]) => {
        updatedLists.forEach(list => {
            list.words.sort((a, b) => Number(a.id) - Number(b.id));
        });
        
        setWordLists(updatedLists);
        localStorage.setItem(VOCABULARY_LISTS_KEY, JSON.stringify(updatedLists));
        setIsWordManagerOpen(false);
    };
    
    const handleRangesDefined = (ranges: TestRange[]) => {
        if (ranges.length === 0) {
            setError({ message: `テスト範囲が指定されていません。`, code: 'NO_RANGES_DEFINED' });
            return;
        }

        setError(null);
        setTestRanges(ranges);
        setStep(2);
    };

    const handleConfigChange = (newConfig: QuestionConfig) => {
        setConfig(newConfig);
    };

    const handleGenerateTest = async () => {
        if (!apiKey) {
            setError({ message: 'APIキーが設定されていません。', code: 'NO_API_KEY' });
            return;
        }
        
        if (testMode === 'vocabulary' && !activeList) {
            setError({ message: 'アクティブな単語リストが見つかりません。', code: 'NO_ACTIVE_LIST' });
            return;
        }

        setIsGenerating(true);
        setError(null);
        setProgressMessage('テスト生成を開始します...');
        
        try {
            const results: GeneratedTestData[] = [];

            if (testMode === 'listening') {
                const count = Math.max(1, listeningConfig.testCount);
                for (let i = 0; i < count; i++) {
                    setProgressMessage(`リスニングテスト ${i + 1}/${count} を生成中...`);
                    // For listening tests without word lists, pass empty array
                    const result = await generateListeningTest(apiKey, [], listeningConfig, (msg) => {
                         setProgressMessage(`リスニングテスト ${i + 1}/${count}: ${msg}`);
                    });
                    results.push({ ...result, title: `Listening Test ${i + 1}` });
                }

            } else {
                for (let i = 0; i < testRanges.length; i++) {
                    const range = testRanges[i];
                    setProgressMessage(`テスト ${i + 1}/${testRanges.length} を生成中: ${range.name}`);
                    
                    const start = parseInt(range.startId, 10);
                    const end = parseInt(range.endId, 10);
                    
                    const wordsForRange = activeList!.words.filter(word => {
                        const numId = Number(word.id);
                        return numId >= start && numId <= end;
                    });

                    if (wordsForRange.length === 0) {
                        console.warn(`Skipping range "${range.name}" as no words were found.`);
                        continue;
                    }

                    const result = await generateTest(apiKey, wordsForRange, config, (msg) => {
                         setProgressMessage(`テスト ${i + 1}/${testRanges.length} (${range.name}): ${msg}`);
                    });

                    results.push({ ...result, title: range.name });
                }
            }

            if(results.length === 0) {
                throw new Error("テストを生成できませんでした。設定または単語リストを確認してください。");
            }

            setTestBatchData(results);
            setStep(3);
        } catch (err: any) {
            console.error(err);
            setError({
                message: err.message || '不明なエラーが発生しました。',
                code: err.code || 'GENERATION_FAILED'
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const activeList = wordLists.find(list => list.id === activeListId) || null;

    const goToPrevStep = () => {
        if (step === 2 && testMode === 'listening') {
            setStep(0); // Go back to mode selection
        } else {
            setStep(s => s - 1);
        }
    };
    
    const restart = () => {
        setStep(0); // Go back to mode selection
        setTestBatchData(null);
        setError(null);
        setTestRanges([]);
    };
    
    const handleModeSelect = (mode: 'vocabulary' | 'listening') => {
        setTestMode(mode);
        if (mode === 'vocabulary') {
            setStep(1);
        } else {
            setStep(2); // Skip word source selection
        }
    };

    const renderStep = () => {
        if (isGenerating) {
            return <ProgressDisplay message={progressMessage} />;
        }
        if (error && step !== 3) {
            return <ErrorDisplay error={error} />;
        }

        switch (step) {
            case 0:
                return <ModeSelector onSelectMode={handleModeSelect} />;
            case 1:
                return <WordSourceSelector 
                    wordLists={wordLists}
                    activeList={activeList}
                    onSelectList={setActiveListId}
                    onOpenManager={() => setIsWordManagerOpen(true)}
                    onCreateTests={handleRangesDefined}
                    error={error}
                    clearError={() => setError(null)}
                />;
            case 2:
                return <TestConfigurator 
                    config={config} 
                    onConfigChange={handleConfigChange}
                    listeningConfig={listeningConfig}
                    onListeningConfigChange={setListeningConfig}
                    mode={testMode}
                    onGenerateTest={handleGenerateTest} 
                    isGenerating={isGenerating} 
                    isApiKeyValid={isApiKeyValid} 
                    onBack={goToPrevStep}
                    rangesCount={testRanges.length}
                />;
            case 3:
                if (testBatchData) {
                    return <GeneratedTest testBatch={testBatchData} onRestart={restart} error={error} />;
                }
                if (error) {
                    return (
                        <div>
                            <ErrorDisplay error={error} />
                             <div className="mt-8 flex justify-start">
                                <button onClick={restart} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700">
                                    最初からやり直す
                                </button>
                            </div>
                        </div>
                    );
                }
                return <p>テストデータがありません。ステップ1からやり直してください。</p>;
            default:
                return <p>不明なステップです。</p>;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div 
                        className="flex items-center gap-3 cursor-pointer" 
                        onClick={() => { if(step > 0 && confirm('トップ画面に戻りますか？入力内容は破棄されます。')) restart(); }}
                    >
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-2 shadow-lg shadow-indigo-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI単語テスト<span className="text-indigo-600">ジェネレーター</span></h1>
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {step > 0 && (
                    <div className="mb-10">
                        <Stepper currentStep={step} mode={testMode} />
                    </div>
                )}
                {renderStep()}
            </main>
            
            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
            {isWordManagerOpen && (
                <WordListManagerModal
                    onClose={() => setIsWordManagerOpen(false)}
                    onUpdateLists={handleListsUpdate}
                    initialLists={wordLists}
                />
            )}
        </div>
    );
}

export default App;
