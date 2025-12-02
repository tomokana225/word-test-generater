
import React from 'react';
import { QuestionConfig, ListeningConfig, GradeLevel } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';

interface TestConfiguratorProps {
    config: QuestionConfig;
    onConfigChange: (newConfig: QuestionConfig) => void;
    
    // New Props for Listening
    listeningConfig?: ListeningConfig;
    onListeningConfigChange?: (newConfig: ListeningConfig) => void;
    mode: 'vocabulary' | 'listening';
    
    onGenerateTest: () => void;
    isGenerating: boolean;
    isApiKeyValid: boolean;
    onBack: () => void;
    rangesCount?: number; // Optional because listening mode might not use ranges
}

const questionMetadata: { [key in keyof QuestionConfig]: { title: string; description: string; icon: React.ElementType, colorClass: string } } = {
    translation: { 
        title: "日→英 翻訳", 
        description: "日本語に対応する英単語を記述", 
        icon: LanguageIcon,
        colorClass: "text-blue-600 bg-blue-50"
    },
    reverseTranslation: { 
        title: "英→日 翻訳", 
        description: "英文中の単語の意味を日本語で記述", 
        icon: LanguageIcon,
        colorClass: "text-indigo-600 bg-indigo-50"
    },
    multipleChoice: { 
        title: "4択問題", 
        description: "正しい日本語訳を選択肢から選ぶ", 
        icon: ListBulletIcon,
        colorClass: "text-emerald-600 bg-emerald-50"
    },
    fillInTheBlank: { 
        title: "スペル問題", 
        description: "日本語訳に合う英単語を記述", 
        icon: PencilSquareIcon,
        colorClass: "text-amber-600 bg-amber-50"
    },
    synonym: { 
        title: "類義語 (英英)", 
        description: "正しい類義語を選択肢から選ぶ", 
        icon: ArrowsRightLeftIcon,
        colorClass: "text-purple-600 bg-purple-50"
    },
    antonym: { 
        title: "対義語 (英英)", 
        description: "正しい対義語を選択肢から選ぶ", 
        icon: ArrowsRightLeftIcon,
        colorClass: "text-pink-600 bg-pink-50"
    },
};

const GRAMMAR_OPTIONS = [
    { id: 'be_verb', label: 'be動詞' },
    { id: 'general_verb', label: '一般動詞' },
    { id: 'progressive_present', label: '現在進行形' },
    { id: 'past_tense', label: '過去形' },
    { id: 'progressive_past', label: '過去進行形' },
    { id: 'future', label: '未来形 (will/be going to)' },
    { id: 'auxiliary', label: '助動詞 (can, must, etc)' },
    { id: 'infinitive', label: '不定詞' },
    { id: 'gerund', label: '動名詞' },
    { id: 'comparison', label: '比較' },
    { id: 'passive', label: '受動態' },
    { id: 'perfect_present', label: '現在完了形' },
    { id: 'relative_pronoun', label: '関係代名詞' },
    { id: 'subjunctive', label: '仮定法' },
    { id: 'participle', label: '分詞構文' },
];

const DIFFICULTY_LEVELS: { id: GradeLevel; label: string; sub: string }[] = [
    { id: 'jh1', label: '中1', sub: 'JH 1' },
    { id: 'jh2', label: '中2', sub: 'JH 2' },
    { id: 'jh3', label: '中3', sub: 'JH 3' },
    { id: 'hs1', label: '高1', sub: 'HS 1' },
    { id: 'hs2', label: '高2', sub: 'HS 2' },
    { id: 'hs3', label: '高3', sub: 'HS 3' },
];

const TestConfigurator: React.FC<TestConfiguratorProps> = ({ 
    config, onConfigChange, 
    listeningConfig, onListeningConfigChange, mode,
    onGenerateTest, isGenerating, isApiKeyValid, onBack, rangesCount 
}) => {
    const handleCountChange = (type: keyof QuestionConfig, delta: number) => {
        const newCount = Math.max(0, config[type] + delta);
        onConfigChange({ ...config, [type]: newCount });
    };

    const totalQuestions = mode === 'vocabulary' 
        ? Object.values(config).reduce((sum: number, count: number) => sum + count, 0)
        : (listeningConfig?.questionCount || 0);

    const renderVocabularyConfig = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(Object.keys(config) as Array<keyof QuestionConfig>).map((type) => {
                const meta = questionMetadata[type];
                const Icon = meta.icon;
                return (
                    <div key={type} className={`bg-white rounded-xl border transition-all duration-200 flex flex-col ${config[type] > 0 ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                        <div className="p-4 flex-grow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${meta.colorClass}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-slate-800">{meta.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed min-h-[2.5em]">
                                {meta.description}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
                            <button 
                                onClick={() => handleCountChange(type, -1)} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                                disabled={config[type] === 0}
                            >
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <span className={`text-2xl font-bold w-12 text-center ${config[type] > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                {config[type]}
                            </span>
                            <button 
                                onClick={() => handleCountChange(type, 1)} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const handleGrammarToggle = (grammarLabel: string) => {
        if (!listeningConfig || !onListeningConfigChange) return;
        const current = listeningConfig.grammarPoints || [];
        const exists = current.includes(grammarLabel);
        let newPoints;
        if (exists) {
            newPoints = current.filter(g => g !== grammarLabel);
        } else {
            newPoints = [...current, grammarLabel];
        }
        onListeningConfigChange({ ...listeningConfig, grammarPoints: newPoints });
    };

    const renderListeningConfig = () => {
        if (!listeningConfig || !onListeningConfigChange) return null;
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                         <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><LanguageIcon className="w-5 h-5" /></span>
                         基本設定
                    </h3>
                    
                    {/* Difficulty Level (Grades) */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">難易度 (学年)</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {DIFFICULTY_LEVELS.map((level) => (
                                <label 
                                    key={level.id}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${listeningConfig.difficulty === level.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <input 
                                        type="radio" 
                                        name="difficulty" 
                                        className="hidden"
                                        checked={listeningConfig.difficulty === level.id} 
                                        onChange={() => onListeningConfigChange({ ...listeningConfig, difficulty: level.id })}
                                    />
                                    <span className="text-lg font-bold leading-none mb-1">{level.label}</span>
                                    <span className="text-[10px] uppercase font-semibold opacity-70">{level.sub}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Grammar Points Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            使用する文法 (複数選択可)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {GRAMMAR_OPTIONS.map((g) => {
                                const isSelected = listeningConfig.grammarPoints?.includes(g.label);
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => handleGrammarToggle(g.label)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium border text-left transition-all ${
                                            isSelected 
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            {g.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            選択しない場合は、難易度に合わせてAIが自動的に決定します。
                        </p>
                    </div>

                    {/* Theme */}
                    <div className="mb-2">
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                            テストのテーマ (任意)
                        </label>
                        <input 
                            type="text" 
                            value={listeningConfig.theme || ''}
                            onChange={(e) => onListeningConfigChange({ ...listeningConfig, theme: e.target.value })}
                            placeholder="例: At the restaurant, Travel, Daily conversation..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            空欄の場合は、AIがランダムに日常的なテーマを選択します。
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Question Count */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg"><ListBulletIcon className="w-5 h-5" /></span>
                             1テストあたりの問題数
                        </h3>
                         <div className="flex items-center justify-between">
                            <button 
                                onClick={() => onListeningConfigChange({ ...listeningConfig, questionCount: Math.max(1, listeningConfig.questionCount - 1) })} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <span className="text-3xl font-bold text-slate-800">{listeningConfig.questionCount}</span>
                            <button 
                                onClick={() => onListeningConfigChange({ ...listeningConfig, questionCount: Math.min(20, listeningConfig.questionCount + 1) })} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                     {/* Test Count (Batch Generation) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><PlusIcon className="w-5 h-5" /></span>
                             作成するテスト数
                        </h3>
                         <div className="flex items-center justify-between">
                            <button 
                                onClick={() => onListeningConfigChange({ ...listeningConfig, testCount: Math.max(1, listeningConfig.testCount - 1) })} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                <MinusIcon className="w-5 h-5" />
                            </button>
                            <span className="text-3xl font-bold text-slate-800">{listeningConfig.testCount}</span>
                            <button 
                                onClick={() => onListeningConfigChange({ ...listeningConfig, testCount: Math.min(10, listeningConfig.testCount + 1) })} 
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <span className="bg-purple-100 text-purple-700 p-1.5 rounded-lg"><PencilSquareIcon className="w-5 h-5" /></span>
                             オプション
                        </h3>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="illustrations" 
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-indigo-600 transition-all duration-300"
                                    checked={listeningConfig.includeIllustrations}
                                    onChange={(e) => onListeningConfigChange({ ...listeningConfig, includeIllustrations: e.target.checked })}
                                />
                                <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${listeningConfig.includeIllustrations ? 'bg-indigo-600' : 'bg-slate-300'}`}></label>
                            </div>
                            <span className="font-bold text-slate-700">イラスト選択肢を含める</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-2">
                            AIが選択肢の画像を生成します。(生成に時間がかかります)
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {/* Header Section */}
             <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                {mode === 'vocabulary' ? '2' : '設定'}
                            </span>
                            {mode === 'vocabulary' ? 'テスト形式の設定' : 'リスニングテスト設定'}
                        </h2>
                        {mode === 'vocabulary' ? (
                            <p className="text-slate-600 mt-2 ml-10">
                                指定した <span className="font-semibold">{rangesCount}</span> つの範囲について、テストの種類を選択してください。
                            </p>
                        ) : (
                            <p className="text-slate-600 mt-2 ml-10">
                                作成するリスニングテストの詳細を設定してください。
                            </p>
                        )}
                    </div>
                     <div className="flex items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 self-start md:self-center">
                        <span className="text-sm font-medium text-slate-500 mr-3">合計問題数</span>
                        <span className={`text-3xl font-bold ${totalQuestions === 0 ? 'text-slate-300' : 'text-indigo-600'}`}>
                            {totalQuestions}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">問 / テスト</span>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50/50">
                {!isApiKeyValid && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6 flex items-start gap-3" role="alert">
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="font-bold">APIキーが設定されていないか無効です。</p>
                            <p className="text-sm mt-1">右上の設定アイコン(歯車)から、有効なGemini APIキーを設定してください。</p>
                        </div>
                    </div>
                )}

                {mode === 'vocabulary' ? renderVocabularyConfig() : renderListeningConfig()}

                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
                     <button
                        onClick={onBack}
                        className="px-6 py-3 text-slate-600 font-semibold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        戻る
                    </button>
                    <button
                        onClick={onGenerateTest}
                        disabled={isGenerating || totalQuestions === 0 || !isApiKeyValid}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none transition-all flex items-center justify-center space-x-2 min-w-[200px]"
                    >
                        {isGenerating ? (
                            <>
                                <SpinnerIcon className="w-5 h-5" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">テストを自動生成</span>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestConfigurator;
