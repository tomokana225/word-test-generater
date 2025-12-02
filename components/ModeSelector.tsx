
import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface ModeSelectorProps {
    onSelectMode: (mode: 'vocabulary' | 'listening') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-10 text-center">
                作成するテストの種類を選択してください
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Vocabulary Test Card */}
                <button
                    onClick={() => onSelectMode('vocabulary')}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 text-left flex flex-col h-full"
                >
                    <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
                        <BookOpenIcon className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                        単語テスト
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                        単語帳（Excel/CSV）を読み込み、指定した範囲から様々な形式（翻訳、穴埋め、4択など）のテストを作成します。
                    </p>
                    <div className="flex items-center text-indigo-600 font-bold text-sm">
                        <span>選択する</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </button>

                {/* Listening Test Card */}
                <button
                    onClick={() => onSelectMode('listening')}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-violet-500 hover:shadow-xl transition-all duration-300 text-left flex flex-col h-full"
                >
                    <div className="bg-violet-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-violet-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors">
                        リスニングテスト (AI生成)
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                        AIがテーマや難易度に合わせてオリジナルのスクリプトと音声を自動生成します。単語帳は不要です。
                    </p>
                    <div className="flex items-center text-violet-600 font-bold text-sm">
                        <span>選択する</span>
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ModeSelector;
