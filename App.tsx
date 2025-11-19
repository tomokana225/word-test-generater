
import { useState, useEffect } from 'react';
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
import { generateTest } from './services/geminiService';
import type { QuestionConfig, AppError, WordList, TestRange, GeneratedTestData } from './types';

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

function App() {
    const [step, setStep] = useState(1);
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
        if (!activeList) {
            setError({ message: 'アクティブな単語リストが見つかりません。', code: 'NO_ACTIVE_LIST' });
            return;
        }

        setIsGenerating(true);
        setError(null);
        setProgressMessage('テスト生成を開始します...');
        
        try {
            const results: GeneratedTestData[] = [];
            for (let i = 0; i < testRanges.length; i++) {
                const range = testRanges[i];
                setProgressMessage(`テスト ${i + 1}/${testRanges.length} を生成中: ${range.name}`);
                
                const start = parseInt(range.startId, 10);
                const end = parseInt(range.endId, 10);
                
                const wordsForRange = activeList.words.filter(word => {
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

                results.push({ title: range.name, ...result });
            }

            if(results.length === 0) {
                throw new Error("指定された全ての範囲でテストを生成できませんでした。単語が見つからないか、他の問題が発生した可能性があります。");
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

    const goToPrevStep = () => setStep(s => s - 1);
    const restart = () => {
        setStep(1);
        setTestBatchData(null);
        setError(null);
        setTestRanges([]);
    };

    const renderStep = () => {
        if (isGenerating) {
            return <ProgressDisplay message={progressMessage} />;
        }
        if (error && step !== 3) {
            return <ErrorDisplay error={error} />;
        }

        switch (step) {
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
        <div className="bg-slate-50 min-h-screen font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800">AI単語テストジェネレーター</h1>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-100">
                        <SettingsIcon className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Stepper currentStep={step} />
                    </div>
                    {renderStep()}
                </div>
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
