import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WordPair, QuestionConfig, Question, Answer, GeneratedTestData, ListeningConfig, GradeLevel } from '../types';

// Helper function to introduce a delay, used for retrying API calls
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Caches for generated options to avoid redundant API calls during self-repair
const optionsCache = new Map<string, string[]>();

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
        const message = error.message?.includes('API key not valid') ? 'The provided API key is invalid.' : 'Failed to validate API key. Check network or key permissions.';
        return { isValid: false, error: message };
    }
};


/**
 * Generates a list of 4 multiple-choice options for a given English word.
 * This is used for self-repairing test data if the AI fails to generate options initially.
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
            const prompt = `'${word}'という英単語の日本語訳として、正しいものを1つ、間違いを3つ含む合計4つの選択肢をJSON配列で生成してください。
            重要: 各選択肢の訳は、その単語の最も一般的で適切な意味を「1つだけ」選んで記述してください。複数の意味を並列（例：「意味1、意味2」）しないでください。
            例: ["回答1", "回答2", "回答3", "回答4"]`;

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
            console.error(`Attempt ${attempt + 1} failed to generate options for ${word}:`, error);
            if (error.status === 429) {
                await delay(2000 * (attempt + 1));
            }
        }
        attempt++;
    }
    // Fallback if generation fails
    return ["選択肢生成エラー", "選択肢生成エラー", "選択肢生成エラー", "選択肢生成エラー"];
};

/**
 * Generates the vocabulary test based on the provided configuration.
 */
export const generateTest = async (
    apiKey: string,
    words: WordPair[],
    config: QuestionConfig,
    onProgress: (message: string) => void
): Promise<GeneratedTestData> => {
    const ai = new GoogleGenAI({ apiKey });
    
    const questionsToGenerate: string[] = [];
    if (config.translation > 0) questionsToGenerate.push(`${config.translation} translation questions (Fill-in-the-blank in English sentence based on Japanese clue)`);
    if (config.reverseTranslation > 0) questionsToGenerate.push(`${config.reverseTranslation} reverseTranslation questions (Translate underlined English word in sentence)`);
    if (config.multipleChoice > 0) questionsToGenerate.push(`${config.multipleChoice} multipleChoice questions (Select correct Japanese meaning for English word)`);
    if (config.fillInTheBlank > 0) questionsToGenerate.push(`${config.fillInTheBlank} fillInTheBlank questions (Write English word for Japanese meaning)`);
    if (config.synonym > 0) questionsToGenerate.push(`${config.synonym} synonym questions (Select correct English synonym)`);
    if (config.antonym > 0) questionsToGenerate.push(`${config.antonym} antonym questions (Select correct English antonym)`);

    const wordListString = words.map(w => `${w.id}: ${w.word} (${w.translation})`).join('\n');

    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['translation', 'reverseTranslation', 'multipleChoice', 'fillInTheBlank', 'synonym', 'antonym'] },
                        prompt: { type: Type.STRING },
                        promptWord: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        wordId: { type: Type.STRING }
                    },
                    required: ['type', 'answer', 'wordId'],
                }
            }
        },
        required: ['questions']
    };

    const prompt = `
    You are an expert English teacher creating a vocabulary test.
    Create a test using the provided vocabulary list.
    
    Vocabulary List:
    ${wordListString}
    
    Requirements:
    1. Generate the following questions based on the vocabulary list randomly:
       ${questionsToGenerate.join('\n       ')}
    
    2. Constraints per question type:
       - translation:
         * Create a natural English sentence containing the target word.
         * Replace the target word with its Japanese meaning wrapped in double underscores.
         * Example Prompt: "We need to __創り出す__ a new marketing strategy." (if target is "create")
         * Answer: The original English word ("create").
       
       - reverseTranslation:
         * Create a natural English sentence containing the target word.
         * Wrap the target word in double underscores.
         * Example Prompt: "This position will __require__ at least five years of experience."
         * Answer: The Japanese meaning of the underlined word.

       - multipleChoice:
         * Prompt is the English word.
         * Options are 4 Japanese meanings. One correct, 3 distractors.
       
       - fillInTheBlank: 
         * Prompt is the Japanese meaning.
         * Answer is the English word. (Standard spelling test)

       - synonym: 
         * Prompt is the English word. 
         * Options are 4 English words. One synonym, 3 distractors.

       - antonym: 
         * Prompt is the English word. 
         * Options are 4 English words. One antonym, 3 distractors.
    
    3. **CRITICAL RULE FOR JAPANESE MEANINGS**:
       - When generating Japanese text for answers (reverseTranslation) or options (multipleChoice), strictly provide ONLY ONE most common and appropriate meaning.
       - **DO NOT** list multiple meanings separated by commas, slashes, or parentheses (e.g., avoid "リンゴ (Apple)" or "走る, 経営する").
       - Just output the single best meaning (e.g., "経営する").
    
    4. Ensure the output is valid JSON matching the schema.
    `;

    onProgress("AIがテストを作成中...");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                maxOutputTokens: 8192,
            }
        });

        if (!response.text) throw new Error("No response from AI");

        const data = JSON.parse(response.text);
        let questions: Question[] = data.questions || [];

        const validatedQuestions: Question[] = [];
        const answers: Answer[] = [];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.wordId || !q.answer) continue;

            const originalWord = words.find(w => w.id === q.wordId);
            if (!originalWord) continue;

            // Ensure promptWord is set for types that need it if AI missed it
            if (['multipleChoice', 'synonym', 'antonym'].includes(q.type) && !q.promptWord) {
                q.promptWord = originalWord.word;
            }

            if (['multipleChoice', 'synonym', 'antonym'].includes(q.type)) {
                // Self-repair logic for options
                if (!q.options || q.options.length !== 4) {
                    if (q.type === 'multipleChoice') {
                        const newOptions = await generateOptionsForWord(ai, originalWord.word, onProgress);
                        // Ensure answer is in options
                        if (!newOptions.includes(q.answer)) {
                            newOptions[0] = q.answer; 
                        }
                        q.options = newOptions;
                    } else {
                        // Skip malformed synonym/antonym questions for now
                        continue;
                    }
                }

                // Ensure answer is in options (in case AI provided options but forgot the answer)
                if (!q.options.includes(q.answer)) {
                    q.options[0] = q.answer;
                }

                // Shuffle options to randomize answer position
                for (let j = q.options.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [q.options[j], q.options[k]] = [q.options[k], q.options[j]];
                }
            }
            
            validatedQuestions.push(q);
            answers.push({
                questionIndex: validatedQuestions.length - 1,
                answerText: q.answer,
                wordId: q.wordId
            });
        }

        return {
            title: "Generated Test",
            questions: validatedQuestions,
            answers: answers
        };

    } catch (e: any) {
        console.error("Test generation error:", e);
        throw new Error(`Failed to generate test: ${e.message}`);
    }
};

/**
 * Generates a Listening Test with Script.
 * Audio and Image generation are skipped to avoid Rate Limits.
 */
export const generateListeningTest = async (
    apiKey: string,
    words: WordPair[],
    config: ListeningConfig,
    onProgress: (message: string) => void
): Promise<GeneratedTestData> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Map internal difficulty codes to descriptive strings for the AI
    const difficultyMap: Record<GradeLevel, string> = {
        'jh1': 'Japanese Junior High School 1st Grade (Beginner, CEFR A1)',
        'jh2': 'Japanese Junior High School 2nd Grade (High Beginner, CEFR A1-A2)',
        'jh3': 'Japanese Junior High School 3rd Grade (Low Intermediate, CEFR A2)',
        'hs1': 'Japanese High School 1st Grade (Intermediate, CEFR B1)',
        'hs2': 'Japanese High School 2nd Grade (Upper Intermediate, CEFR B1-B2)',
        'hs3': 'Japanese High School 3rd Grade (Advanced, CEFR B2)',
    };

    const targetLevel = difficultyMap[config.difficulty];

    let promptIntro = "";
    if (words.length > 0) {
        const wordListString = words.map(w => `${w.id}: ${w.word} (${w.translation})`).join('\n');
        promptIntro = `
        Vocabulary List to incorporate:
        ${wordListString}
        
        Tasks:
        Create a natural, coherent English listening script (monologue or dialogue) that incorporates as many words from the list as possible.
        `;
    } else {
        const themePrompt = config.theme ? `Theme: "${config.theme}"` : `Theme: General daily life or interesting facts (randomly selected)`;
        promptIntro = `
        ${themePrompt}
        
        Tasks:
        Create a natural, coherent English listening script (monologue or dialogue) relevant to the theme.
        `;
    }

    // Construct grammar instructions
    let grammarInstruction = "";
    if (config.grammarPoints && config.grammarPoints.length > 0) {
        grammarInstruction = `
        IMPORTANT: Incorporate the following grammar points naturally into the script:
        - ${config.grammarPoints.join('\n        - ')}
        `;
    }

    onProgress("リスニング原稿を作成中...");

    // 1. Generate Script ONLY
    // We add a unique timestamp to the prompt to prevent Gemini from returning cached/identical responses when generating multiple tests in a loop.
    const uniqueId = Date.now();
    const scriptPrompt = `
    [Unique Request ID: ${uniqueId}]
    You are an expert English teacher creating a Listening Test.
    Target Audience Level: ${targetLevel}
    ${promptIntro}
    
    Requirements:
    1. Create a natural, coherent English listening script (monologue or dialogue) incorporating the vocabulary/theme.
       Length: Approximately 150-200 words. (Keep it concise and clear).
       The script must be strictly suitable for the '${targetLevel}' level in terms of vocabulary and sentence structure. 
       Do not use advanced words or complex grammar structures that are beyond ${targetLevel} unless necessary for the theme (in which case, keep it simple).
       **FORMATTING RULE**: If the script is a dialogue, strictly format each line as "Speaker Name: Content". E.g., "Man: Hello." or "A: Hi there.". Use a new line for each speaker.
       ${grammarInstruction}
    
    Output Schema (JSON):
    {
      "script": "The full english text of the listening script..."
    }
    `;

    let generatedScript = "";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: scriptPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        script: { type: Type.STRING }
                    }
                },
                maxOutputTokens: 8192,
            }
        });

        if (!response.text) throw new Error("No script generated");
        const data = JSON.parse(response.text);
        if (!data.script || data.script.trim() === "") {
             throw new Error("AI returned an empty script.");
        }
        generatedScript = data.script;
    } catch (e: any) {
        throw new Error(`Script generation failed: ${e.message}`);
    }

    // 2. Generate Questions (No Audio/Image Generation)
    onProgress("問題を作成中...");

    const questionsPrompt = `
    You are an expert English teacher.
    Based on the following listening script, create ${config.questionCount} multiple-choice questions.
    Target Audience Level: ${targetLevel}.
    Ensure the vocabulary in the questions and options is appropriate for ${targetLevel}.

    SCRIPT:
    "${generatedScript}"

    Requirements:
    1. Create ${config.questionCount} multiple-choice questions based on the script.
    ${config.includeIllustrations 
        ? 'Some questions should be "listening-image" type where the user must choose the correct picture.' 
        : 'All questions should be standard multiple-choice text.'}
    
    2. For "listening-image" questions:
    - The 'options' array should contain 4 short descriptive text prompts describing the image.
    - **IMPORTANT**: The descriptions must be for **Simple, Black and White Line Art**.
    - **CRITICAL**: When describing people, **ALWAYS specify their gender clearly** (e.g., "a boy", "a girl", "a man", "a woman") instead of using ambiguous terms like "a person" or "someone".
    - One description must match the correct answer found in the script.
    - Three descriptions must be distractors.
    - 'answer' should be the text of the correct description.

    3. For standard "listening" questions:
    - 'options' should be 4 text choices.
    - 'answer' should be the correct text choice.

    Output Schema (JSON):
    {
        "questions": [
            {
            "type": "listening" or "listening-image",
            "prompt": "The question to ask the student",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A"
            }
        ]
    }
    `;

    let generatedQuestions: any[] = [];
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: questionsPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['listening', 'listening-image'] },
                                    prompt: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    answer: { type: Type.STRING }
                                },
                                required: ['type', 'prompt', 'options', 'answer']
                            }
                        }
                    }
                },
                maxOutputTokens: 8192,
            }
        });
        if (response.text) {
            generatedQuestions = JSON.parse(response.text).questions;
        }
    } catch (e: any) {
            throw new Error(`Question generation failed: ${e.message}`);
    }

    const processedQuestions: Question[] = [];
    const answers: Answer[] = [];

    for (let i = 0; i < generatedQuestions.length; i++) {
        const q = generatedQuestions[i];
        
        // Shuffle options
        if (q.options && q.options.length > 0) {
                for (let j = q.options.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [q.options[j], q.options[k]] = [q.options[k], q.options[j]];
            }
        }

        const processedQ: Question = {
            type: q.type,
            prompt: q.prompt,
            answer: q.answer,
            options: q.options,
            wordId: "Listening"
        };

        // Note: We are deliberately SKIPPING image generation here to prevent API Rate Limit errors.
        // The 'options' array contains the descriptions which will be displayed in the UI.

        processedQuestions.push(processedQ);
        answers.push({
            questionIndex: i,
            answerText: processedQ.answer,
            wordId: "-"
        });
    }

    return {
        title: `Listening Test (${targetLevel})`,
        questions: processedQuestions,
        answers: answers,
        // No audioBase64 returned.
        script: generatedScript
    };
};
```]]></content>
  </change>
</changes>