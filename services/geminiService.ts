// FIX: The incorrect class name `GoogleGenerativeAI` is replaced with the correct one, `GoogleGenAI`.
// FIX: Added 'Answer' to the import list to resolve type errors.
import { GoogleGenAI, Type } from "@google/genai";
import { WordPair, QuestionConfig, Question, Answer } from '../types';

// Helper function to introduce a delay, used for retrying API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Caches for generated options to avoid redundant API calls during self-repair
const optionsCache = new Map<string, string[]>();
const englishOptionsCache = new Map<string, string[]>();

/**
 * Validates a Gemini API key by making a simple, lightweight call.
 * @param apiKey The API key to validate.
 * @returns An object indicating if the key is valid and an optional error message.
 */
export const validateApiKey = async (apiKey: string): Promise<{ isValid: boolean, error?: string }> => {
    try {
        if (!apiKey) return { isValid: false, error: 'API key is empty' };
        const ai = new GoogleGenAI({ apiKey });
        // Use a very simple, fast model and prompt for validation
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'hi',
        });
        return { isValid: true };
    } catch (error: any) {
        console.error("API Key validation failed:", error);
        const message = error.message.includes('API key not valid') ? 'The provided API key is invalid.' : 'Failed to validate API key. Check network or key permissions.';
        return { isValid: false, error: message };
    }
};


/**
 * Generates a list of 4 multiple-choice options for a given English word.
 * This is used for self-repairing test data if the AI fails to generate options initially.
 * @param ai A configured GoogleGenAI instance.
 * @param word The English word to generate Japanese translation options for.
 * @param onProgress Callback to update the UI with progress messages.
 * @returns A promise that resolves to an array of 4 string options (Japanese translations).
 */
const generateOptionsForWord = async (ai: GoogleGenAI, word: string, onProgress: (message: string) => void): Promise<string[]> => {
    if (optionsCache.has(word)) {
        return optionsCache.get(word)!;
    }
    onProgress(`選択肢を再生成中: ${word}`);
    
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
        try {
            const prompt = `'${word}'という英単語の日本語訳として、正しいものを1つ、間違いを3つ含む合計4つの選択肢をJSON配列で生成してください。各選択肢の訳は、1つか2つの主要な意味に絞って簡潔にしてください。例: ["回答1", "回答2", "回答3", "回答4"]`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                }
            });

            if (response.text) {
                const options = JSON.parse(response.text.trim());
                if (Array.isArray(options) && options.length === 4) {
                    optionsCache.set(word, options);
                    return options;
                }
            }
        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed for generating options for "${word}":`, error);
            if (attempt < maxAttempts - 1) {
                const backoff = Math.pow(2, attempt) * 1000;
                onProgress(`選択肢の生成に失敗しました。${backoff / 1000}秒後に再試行します...`);
                await delay(backoff);
            }
        }
        attempt++;
    }
    throw new Error(`Failed to generate options for word: ${word}`);
};

/**
 * Generates a list of 4 English word options for a given English word (for synonym/antonym questions).
 * This is used for self-repairing test data.
 * @param ai A configured GoogleGenAI instance.
 * @param word The English word to generate options for.
 * @param type The type of question ('synonym' or 'antonym').
 * @param onProgress Callback to update the UI with progress messages.
 * @returns A promise that resolves to an array of 4 string options (English words).
 */
const generateEnglishOptionsForWord = async (ai: GoogleGenAI, word: string, type: 'synonym' | 'antonym', onProgress: (message: string) => void): Promise<string[]> => {
    const cacheKey = `${word}-${type}`;
    if (englishOptionsCache.has(cacheKey)) {
        return englishOptionsCache.get(cacheKey)!;
    }
    onProgress(`${type === 'synonym' ? '類義語' : '対義語'}の選択肢を再生成中: ${word}`);
    
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
        try {
            const prompt = `For the English word '${word}', generate 4 multiple-choice options in a JSON array to find its ${type}. One option must be a correct ${type}, and the other three must be incorrect. For example: ["option1", "option2", "option3", "option4"]`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            if (response.text) {
                const options = JSON.parse(response.text.trim());
                if (Array.isArray(options) && options.length === 4) {
                    englishOptionsCache.set(cacheKey, options);
                    return options;
                }
            }
        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed for generating English options for "${word}":`, error);
            if (attempt < maxAttempts - 1) {
                const backoff = Math.pow(2, attempt) * 1000;
                onProgress(`選択肢の生成に失敗しました。${backoff / 1000}秒後に再試行します...`);
                await delay(backoff);
            }
        }
        attempt++;
    }
    throw new Error(`Failed to generate English options for word: ${word}`);
};

/**
 * Generates a vocabulary test based on a word list and configuration using the Gemini API.
 * Includes robust error handling, retries, and self-repair capabilities.
 * @param apiKey User's Gemini API key.
 * @param wordList An array of word pairs.
 * @param config The configuration for the number of each question type.
 * @param onProgress Callback to update the UI with progress messages.
 * @returns A promise that resolves to an object containing the generated questions and answers.
 */
export const generateTest = async (
    apiKey: string,
    wordList: WordPair[],
    config: QuestionConfig,
    onProgress: (message: string) => void
): Promise<{ questions: Question[]; answers: Answer[] }> => {
    onProgress('AIモデルを初期化しています...');
    const ai = new GoogleGenAI({ apiKey });

    const totalQuestions = Object.values(config).reduce((sum, count) => sum + count, 0);
    onProgress(`合計${totalQuestions}問の問題を作成しています...`);

    const wordListText = wordList.map(pair => `${pair.id}|${pair.word}:${pair.translation}`).join('\n');

    const prompt = `
      You are an expert English teacher creating a vocabulary test for Japanese students.
      Based on the following word list (format: ID|Word:Translation), please generate a test with the specified number of questions for each category.

      Word List:
      ---
      ${wordListText}
      ---

      Generate the test in a valid JSON format according to the following schema and rules.

      Rules:
      1.  For each generated question, you MUST include the 'wordId' field, which corresponds to the ID from the source word in the word list (the number before the '|' character). This is mandatory.
      2.  For 'translation' (日→英): Create a simple English sentence that provides context. The target English word should be replaced by its Japanese translation, and this Japanese part must be underlined by wrapping it in double underscores (__word__). The 'prompt' should be the full sentence. The 'answer' must be the single correct English word.
      3.  For 'reverseTranslation' (英→日): Create a simple English sentence. The target English word must be underlined by wrapping it in double underscores (__word__). The 'prompt' should be the full sentence. The 'answer' must be the correct Japanese translation.
      4.  For 'multipleChoice' (英→日): The 'promptWord' is the English word to be tested. Provide 4 Japanese options: one correct translation and three plausible distractors. The 'answer' must be the correct Japanese translation. The Japanese translations in the options should be concise. If a word has multiple meanings in the provided list, please include only the one or two most common meanings. For example, if the list has "run: 走る, 経営する, 立候補する", a good option would be "走る, 経営する" or just "走る".
      5.  For 'fillInTheBlank': The 'prompt' should be the Japanese translation. The 'answer' is the English word that the student must spell.
      6.  For 'synonym' (英→英): The 'promptWord' is the English word. Provide 4 English options: one correct synonym and three plausible distractors. The 'answer' is the correct English synonym.
      7.  For 'antonym' (英→英): The 'promptWord' is the English word. Provide 4 English options: one correct antonym and three plausible distractors. The 'answer' is the correct English antonym.
      8.  **Crucially**, ensure every 'multipleChoice', 'synonym', and 'antonym' question has both a 'promptWord' and an 'options' array with exactly 4 strings.
      9.  Select words randomly from the provided list for each question, avoiding repetition if possible.

      Example of a good 'translation' question:
      {
        "wordId": "15",
        "type": "translation",
        "prompt": "I need to __予約する__ a room at the hotel.",
        "answer": "reserve"
      }
      
      Example of a bad 'multipleChoice' question (missing options):
      {
        "wordId": "22",
        "type": "multipleChoice",
        "promptWord": "develop",
        "answer": "開発する"
      }
      
      Final Self-Correction Step: Before outputting the JSON, review your generated questions. Does every single 'multipleChoice', 'synonym', and 'antonym' question have an 'options' array with 4 items? And does every question have a 'wordId'? If not, fix it. This is a mandatory requirement.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        wordId: { type: Type.STRING, description: "The ID of the source word from the provided list." },
                        type: {
                            type: Type.STRING,
                            enum: ['translation', 'reverseTranslation', 'multipleChoice', 'fillInTheBlank', 'synonym', 'antonym']
                        },
                        prompt: { type: Type.STRING, description: "The main text of the question. For sentence-based questions, this is the full sentence." },
                        promptWord: { type: Type.STRING, description: "The single word to be tested (for multipleChoice, synonym, antonym)." },
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 4 choices for multiple-choice style questions."
                        },
                        answer: { type: Type.STRING },
                    },
                    required: ["type", "answer", "wordId"]
                }
            }
        },
        required: ["questions"]
    };

    let attempt = 0;
    const maxAttempts = 5;
    while (attempt < maxAttempts) {
        try {
            onProgress(attempt > 0 ? `AIへの問い合わせを再試行中... (${attempt + 1}/${maxAttempts})` : 'AIに問題の生成を依頼しています...');
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
// FIX: The `contents` parameter was incorrectly structured. It has been corrected to be a single prompt string that includes the test configuration, resolving the API call format errors.
                contents: `${prompt}\n\nPlease generate a test with the following configuration: ${JSON.stringify(config)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.7,
                }
            });

            if (!response.text) {
                throw new Error("AIからの応答が空です。");
            }
            
            onProgress('AIからの応答を解析しています...');
            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText);

            let generatedQuestions: Question[] = result.questions || [];

            // --- Validation and Self-Repair ---
            onProgress('生成された内容を検証・修正しています...');
            let needsRepair = false;
            for (let i = 0; i < generatedQuestions.length; i++) {
                const q = generatedQuestions[i];
                if ((q.type === 'multipleChoice' || q.type === 'synonym' || q.type === 'antonym') && (!q.options || q.options.length !== 4)) {
                    needsRepair = true;
                    console.warn(`Repair needed for Q${i+1} (${q.type}): options are missing or incomplete.`);
                }
            }

            if (needsRepair) {
                onProgress('AIの出力に不備が見つかりました。自動修復を開始します...');
                const repairedQuestions: Question[] = [];
                for (const q of generatedQuestions) {
                    let repairedQ = { ...q };
                    try {
                         if (q.type === 'multipleChoice' && (!q.options || q.options.length !== 4)) {
                            if (!q.promptWord) throw new Error(`Cannot repair multipleChoice question without a promptWord.`);
                            repairedQ.options = await generateOptionsForWord(ai, q.promptWord, onProgress);
                        } else if ((q.type === 'synonym' || q.type === 'antonym') && (!q.options || q.options.length !== 4)) {
                            if (!q.promptWord) throw new Error(`Cannot repair ${q.type} question without a promptWord.`);
                            repairedQ.options = await generateEnglishOptionsForWord(ai, q.promptWord, q.type, onProgress);
                        }
                    } catch (repairError: any) {
                         console.error(`Failed to repair question for word "${q.promptWord}". Skipping.`, repairError);
                         continue; // Skip this question if it can't be repaired
                    }
                    repairedQuestions.push(repairedQ);
                }
                generatedQuestions = repairedQuestions;
                onProgress('自動修復が完了しました。');
            }

            // --- Shuffle options for multiple choice questions ---
            onProgress('選択肢をランダムに並び替えています...');
            for (const q of generatedQuestions) {
                if ((q.type === 'multipleChoice' || q.type === 'synonym' || q.type === 'antonym') && q.options && q.options.length > 0) {
                    // Fisher-Yates shuffle algorithm to randomize the options array
                    for (let i = q.options.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
                    }
                }
            }

            const answers: Answer[] = generatedQuestions.map((q, index) => ({
                questionIndex: index,
                answerText: q.answer,
                wordId: q.wordId
            }));

            return { questions: generatedQuestions, answers };

        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            if (attempt < maxAttempts - 1) {
                if (error.message.includes('429') || error.message.includes('503')) {
                    const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    onProgress(`APIが混み合っています。${Math.round(backoff / 1000)}秒後に再試行します...`);
                    await delay(backoff);
                } else {
                     throw error; // Don't retry on non-retryable errors
                }
            } else {
                let userMessage = 'テストの生成に失敗しました。';
                if (error.message.includes('429')) {
                    userMessage = 'APIの無料利用枠の上限に達したか、リクエストが多すぎるため、しばらくしてから再試行してください。';
                } else if (error.message.toLowerCase().includes('json')) {
                    userMessage = 'AIからの応答が不正な形式でした。再度試行してください。';
                } else if (error.message.includes('API key not valid')) {
                    userMessage = 'APIキーが無効です。設定を確認してください。';
                }
                const finalError = new Error(userMessage);
                (finalError as any).code = 'GENERATION_FAILED';
                throw finalError;
            }
        }
    }
    throw new Error('テストの生成に失敗しました。すべての再試行が完了しました。');
};