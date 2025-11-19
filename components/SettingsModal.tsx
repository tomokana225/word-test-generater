import React, { useState, useContext } from 'react';
import { ApiKeyContext } from '../contexts/ApiKeyContext';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const { apiKey, setApiKey, validationStatus, validateCurrentApiKey } = useContext(ApiKeyContext);
    const [localApiKey, setLocalApiKey] = useState(apiKey || '');

    const handleSave = async () => {
        setApiKey(localApiKey);
        // The context's useEffect will trigger validation, but we can trigger it manually for immediate feedback
        await validateCurrentApiKey();
        onClose();
    };

    const handleValidate = async () => {
        setApiKey(localApiKey); // Set it first so validation can pick it up
        await validateCurrentApiKey();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">設定</h2>
                
                <div className="space-y-2">
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700">
                        Gemini APIキー
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            id="api-key-input"
                            type="password"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="APIキーを入力"
                        />
                        {validationStatus === 'validating' && <SpinnerIcon className="w-5 h-5 text-slate-400" />}
                        {validationStatus === 'valid' && <CheckIcon className="w-6 h-6 text-green-500" />}
                        {validationStatus === 'invalid' && localApiKey && <XMarkIcon className="w-6 h-6 text-red-500" />}
                    </div>
                     <p className="text-xs text-slate-500 mt-1">
                        APIキーは <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a> から取得できます。
                    </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="py-2 px-4 rounded-md text-slate-700 font-semibold hover:bg-slate-100">
                        キャンセル
                    </button>
                    <button onClick={handleValidate} disabled={validationStatus === 'validating'} className="py-2 px-4 rounded-md text-indigo-700 font-semibold border border-indigo-300 hover:bg-indigo-50 disabled:opacity-50">
                        {validationStatus === 'validating' ? '検証中...' : '検証'}
                    </button>
                    <button onClick={handleSave} className="py-2 px-4 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                        保存して閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;