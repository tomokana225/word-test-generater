import React from 'react';
import { QuestionConfig } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface TestConfiguratorProps {
    config: QuestionConfig;
    onConfigChange: (newConfig: QuestionConfig) => void;
    onGenerateTest: () => void;
    isGenerating: boolean;
    isApiKeyValid: boolean;
    onBack: () => void;
    rangesCount: number;
}

const questionLabels: { [key in keyof QuestionConfig]: { title: string; description: string } } = {
    translation: { title: "日→英 翻訳問題", description: "例文中の日本語を英単語に訳す (例: I have a (ペン) -> pen)" },
    reverseTranslation: { title: "英→日 翻訳問題", description: "例文中の英単語を日本語に訳す (例: I have a (pen) -> ペン)" },
    multipleChoice: { title: "4択問題 (英→日)", description: "英単語の正しい日本語訳を4つの選択肢から選ぶ" },
    fillInTheBlank: { title: "スペル問題", description: "表示された日本語訳に合う英単語を記述する" },
    synonym: { title: "類義語問題 (英→英)", description: "英単語の類義語を4つの英単語の選択肢から選ぶ" },
    antonym: { title: "対義語問題 (英→英)", description: "英単語の対義語を4つの英単語の選択肢から選ぶ" },
};


const TestConfigurator: React.FC<TestConfiguratorProps> = ({ 
    config, onConfigChange, onGenerateTest, isGenerating, isApiKeyValid, onBack, rangesCount 
}) => {
    const handleCountChange = (type: keyof QuestionConfig, delta: number) => {
        const newCount = Math.max(0, config[type] + delta);
        onConfigChange({ ...config, [type]: newCount });
    };

    const totalQuestions = Object.values(config).reduce((sum: number, count: number) => sum + count, 0);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">ステップ2: 問題形式と数の設定</h2>
            <p className="text-slate-600 mb-2">各問題形式の出題数を設定してください。1テストあたりの合計問題数: <span className="font-bold text-indigo-600">{totalQuestions}</span></p>
            <p className="text-slate-500 mb-6 text-sm">この設定は、ステップ1で指定した <span className="font-semibold">{rangesCount}</span> 個のテスト範囲すべてに適用されます。</p>

            {!isApiKeyValid && (
                 <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6" role="alert">
                    <p className="font-semibold">APIキーが無効です。右上の設定アイコンから有効なキーを設定してください。</p>
                </div>
            )}

            <div className="space-y-4">
                {/* FIX: Cast Object.keys to an array of QuestionConfig keys to ensure proper type inference for 'type', resolving multiple subsequent type errors. */}
                {(Object.keys(config) as Array<keyof QuestionConfig>).map((type) => (
                    <div key={type} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                            <h3 className="font-semibold text-slate-800">{questionLabels[type].title}</h3>
                            <p className="text-sm text-slate-500">{questionLabels[type].description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleCountChange(type, -1)} className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors">
                                <MinusIcon className="w-5 h-5 text-slate-700" />
                            </button>
                            <span className="text-lg font-bold text-slate-800 w-8 text-center">{config[type]}</span>
                            <button onClick={() => handleCountChange(type, 1)} className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors">
                                <PlusIcon className="w-5 h-5 text-slate-700" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

             <div className="mt-8 flex justify-between items-center">
                 <button
                    onClick={onBack}
                    className="px-6 py-2 text-slate-700 font-semibold rounded-md hover:bg-slate-100 transition-colors"
                >
                    戻る
                </button>
                <button
                    onClick={onGenerateTest}
                    disabled={isGenerating || totalQuestions === 0 || !isApiKeyValid}
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 w-48"
                >
                    {isGenerating ? (
                        <>
                            <SpinnerIcon className="w-5 h-5" />
                            <span>生成中...</span>
                        </>
                    ) : (
                        <span>テストを自動生成</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TestConfigurator;