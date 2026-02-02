
import { Question, GeneratedTestData, DraggableElementData, PageStyleSettings } from '../types';

function escapeHtml(text: string): string {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function processPrompt(prompt: string): string {
    // Convert __word__ to a span with underline style
    return escapeHtml(prompt).replace(/__(.*?)__/g, '<span style="text-decoration: underline; font-weight: bold; padding: 0 4px;">$1</span>');
}

const questionTypeTitles: { [key: string]: string } = {
    translation: '次の英文の下線部の日本語を英語に直し、文を完成させなさい。',
    reverseTranslation: '次の英文の下線部の単語の意味を日本語で答えなさい。',
    multipleChoice: '次の英単語の日本語訳として最も適切なものを、選択肢 a) ～ d) から一つ選びなさい。',
    fillInTheBlank: '次の日本語訳に合う英単語を答えなさい。',
    synonym: '次の英単語の類義語として最も適切なものを、選択肢 a) ～ d) から一つ選びなさい。',
    antonym: '次の英単語の対義語として最も適切なものを、選択肢 a) ～ d) から一つ選びなさい。',
    listening: '英語を聞いて、質問に対する答えとして最も適切なものを、選択肢 a) ～ d) から一つ選びなさい。',
    'listening-image': '英語を聞いて、質問に対する答えとして最も適切なイラストを、選択肢 a) ～ d) から一つ選びなさい。',
};

const questionOrder: string[] = ['listening', 'listening-image', 'translation', 'reverseTranslation', 'multipleChoice', 'fillInTheBlank', 'synonym', 'antonym'];

export function buildTestHtml(questions: Question[], audioBase64?: string): string {
    let html = '';
    let globalIndex = 1;

    // Add Audio Player if available (only visible on screen, hidden in print via CSS)
    if (audioBase64) {
        html += `<div class="audio-player-container no-print" style="margin-bottom: 20px; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #0284c7;">🔊 リスニング音声</p>
            <audio controls src="data:audio/mp3;base64,${audioBase64}" style="width: 100%;"></audio>
        </div>`;
    }

    // Sort questions by type
    const groupedQuestions: { [key: string]: Question[] } = {};
    questions.forEach(q => {
        if (!groupedQuestions[q.type]) groupedQuestions[q.type] = [];
        groupedQuestions[q.type].push(q);
    });

    questionOrder.forEach(type => {
        const typeQuestions = groupedQuestions[type];
        if (!typeQuestions || typeQuestions.length === 0) return;

        // Section Title
        html += `<div class="section-title" style="font-weight: bold; font-size: 1.05em; margin-top: 15px; margin-bottom: 5px;">[${type.includes('listening') ? 'listening' : type}] ${questionTypeTitles[type]}</div>`;
        
        typeQuestions.forEach((q) => {
            html += `<div class="question-item" style="margin-bottom: 0.8em;">`;
            
            // Question Prompt using Table for Word compatibility
            html += `<table class="question-text" style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 2px;">
                <tr>
                    <td class="question-number" style="width: 2em; vertical-align: top; white-space: nowrap;">${globalIndex}.</td>
                    <td style="vertical-align: top;">${processPrompt(q.prompt || q.promptWord || '')}</td>
                </tr>
            </table>`;

            // Options handling
            if (q.type === 'listening-image') {
                if (q.imageOptions && q.imageOptions.some(opt => opt !== "")) {
                    // Render Images if available
                    html += `<table style="width: 100%; margin-top: 8px; margin-left: 24px; border-collapse: separate; border-spacing: 10px;">
                        <tr>`;
                    q.imageOptions.forEach((imgBase64, idx) => {
                        const label = String.fromCharCode(97 + idx); // a, b, c, d
                        const imgTag = imgBase64 
                            ? `<img src="data:image/png;base64,${imgBase64}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; max-height: 150px;" />` 
                            : '<div style="border:1px dashed #ccc; padding:20px;">Image Error</div>';
                        
                        if (idx === 2) html += `</tr><tr>`; // Start new row after 2 items
                        
                        html += `<td style="text-align: center; vertical-align: top; width: 50%;">
                            <div style="font-weight: bold; margin-bottom: 2px;">${label})</div>
                            ${imgTag}
                        </td>`;
                    });
                    html += `</tr></table>`;
                } else if (q.options) {
                    // Render Text Description Placeholders (Fallback when image generation is disabled)
                    html += `<table style="width: 100%; margin-top: 8px; margin-left: 24px; border-collapse: separate; border-spacing: 10px;">
                        <tr>`;
                    q.options.forEach((opt, idx) => {
                         const label = String.fromCharCode(97 + idx);
                         if (idx === 2) html += `</tr><tr>`;
                         html += `<td style="border: 1px dashed #9ca3af; padding: 10px; border-radius: 6px; background-color: #f9fafb; font-size: 0.8em; color: #4b5563; vertical-align: top; width: 50%;">
                            <div style="font-weight: bold; margin-bottom: 4px; color: #000;">${label})</div>
                            <div><span style="font-weight:bold;">[画像指示]</span> ${escapeHtml(opt)}</div>
                         </td>`;
                    });
                    html += `</tr></table>`;
                }
            } else if (['multipleChoice', 'synonym', 'antonym', 'listening'].includes(q.type) && q.options) {
                // Text Options
                // Use table layout for better copy-paste compatibility with Word
                html += `<table style="width: 100%; margin-top: 4px; margin-left: 24px; font-size: 0.95em; border-collapse: collapse; border: none;"><tbody><tr>`;
                q.options.forEach((opt, idx) => {
                    const label = String.fromCharCode(97 + idx); // a, b, c, d
                    html += `<td style="width: 25%; padding: 2px 4px; border: none; vertical-align: top;">${label}) ${escapeHtml(opt)}</td>`;
                });
                html += `</tr></tbody></table>`;
            }

            html += `</div>`;
            globalIndex++;
        });
    });

    return html;
}

export function buildTestBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map((data, index) => {
         const marginTop = index > 0 ? 'margin-top: 30mm;' : '';
         const titleHtml = `<h1 style="text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 1em; text-decoration: underline; ${marginTop}">${escapeHtml(data.title)}</h1>`;
         const contentHtml = buildTestHtml(data.questions, data.audioBase64);
         return `${titleHtml}${contentHtml}`;
    }).join('');
}

// --- Answer Sheet Builders ---

export function buildAnswerSheetHtml(data: GeneratedTestData): string {
    let html = `<div class="answer-sheet-instance">`;
    html += `<h2 style="font-size: 1.2em; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">${escapeHtml(data.title)} - 解答</h2>`;
    
    // Add Script if present (Listening Test)
    if (data.script) {
        // Format script to handle newlines and speakers
        const formattedScript = data.script.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            
            // Check for speaker pattern. 
            // Matches "Man:", "Woman:", "A:", "Speaker 1:", etc. at the start of the line.
            const match = trimmed.match(/^([A-Za-z0-9\s]+?):\s*(.*)$/);
            
            if (match) {
                const speaker = escapeHtml(match[1]);
                const content = escapeHtml(match[2]);
                // Use hanging indent for cleaner dialogue formatting
                return `<div style="margin-bottom: 6px; padding-left: 3.5em; text-indent: -3.5em;">
                    <span style="font-weight: bold; color: #374151; display: inline-block; width: 3em;">${speaker}:</span>${content}
                </div>`;
            } else {
                // Narrative or non-dialogue line
                return `<div style="margin-bottom: 6px;">${escapeHtml(trimmed)}</div>`;
            }
        }).join('');

        html += `<div class="listening-script" style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-size: 0.9em; line-height: 1.6; border-radius: 6px; clear: both;">
            <strong style="display: block; margin-bottom: 8px; color: #4b5563; border-bottom: 1px dashed #d1d5db; padding-bottom: 4px;">[Listening Script]</strong>
            <div style="color: #1f2937;">${formattedScript}</div>
        </div>`;
    }

    html += `<div class="answer-grid">`;
    
    data.answers.forEach((ans) => {
        // Retrieve the question to check for options
        const question = data.questions[ans.questionIndex];
        let displayAnswer = escapeHtml(ans.answerText);

        // If the question is multiple choice (text or image), find the option index
        if (question) {
            if (question.type === 'listening-image' && question.options) {
                // For image questions, the answer text matches one of the descriptions
                const optionIndex = question.options.indexOf(ans.answerText);
                 if (optionIndex !== -1) {
                    const label = String.fromCharCode(97 + optionIndex);
                    // For image questions, just show the label (e.g., "a)")
                    displayAnswer = `${label})`; 
                }
            } else if (['multipleChoice', 'synonym', 'antonym', 'listening'].includes(question.type) && question.options) {
                const optionIndex = question.options.indexOf(ans.answerText);
                if (optionIndex !== -1) {
                    const label = String.fromCharCode(97 + optionIndex);
                    displayAnswer = `${label}) ${displayAnswer}`;
                }
            }
        }

        // Changed from div with flex to Table for Word compatibility
        html += `<table class="answer-item" style="width: 100%; border-bottom: 1px dotted #ccc; margin-bottom: 4px; border-collapse: collapse;">
            <tr>
                <td class="answer-number" style="width: 2.5em; font-weight: bold; vertical-align: top; white-space: nowrap;">${ans.questionIndex + 1}.</td>
                <td class="answer-text" style="font-weight: bold; vertical-align: top;">${displayAnswer}</td>
                ${(ans.wordId && ans.wordId !== "-" && ans.wordId !== "Listening") ? 
                    `<td class="answer-word-id" style="font-size: 0.85em; color: #666; text-align: right; vertical-align: bottom; white-space: nowrap;">（単語番号：${ans.wordId}）</td>` 
                    : ''}
            </tr>
        </table>`;
    });

    html += `</div>`; // End answer-grid
    html += `</div>`; // End instance
    return html;
}

export function buildAnswerSheetBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map(data => buildAnswerSheetHtml(data)).join('<div style="margin-top: 30px; margin-bottom: 30px; border-top: 2px dashed #ccc;"></div>');
}

// --- Printing Builders ---

export function buildPrintHtml(pages: string[], elements: DraggableElementData[], settings: PageStyleSettings): string {
    const pageDimensions = {
        A4: { portrait: { width: '210mm', height: '297mm' }, landscape: { width: '297mm', height: '210mm' } },
        B5: { portrait: { width: '182mm', height: '257mm' }, landscape: { width: '257mm', height: '182mm' } },
        Letter: { portrait: { width: '216mm', height: '279mm' }, landscape: { width: '279mm', height: '216mm' } },
    };
    const size = pageDimensions[settings.paperSize][settings.orientation];

    let style = `
        @page { size: ${settings.paperSize} ${settings.orientation}; margin: 0; }
        body { margin: 0; padding: 0; background: white; font-family: sans-serif; -webkit-print-color-adjust: exact; }
        .print-page {
            position: relative;
            width: ${size.width};
            height: ${size.height};
            overflow: hidden;
            page-break-after: always;
            box-sizing: border-box;
            padding: ${settings.margin}mm;
        }
        .content-layer {
            position: relative;
            width: 100%;
            height: 100%;
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineHeight};
        }
        .element-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .draggable-element {
            position: absolute;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            overflow: hidden;
        }
        /* Base styles matching editor */
        p { margin: 0 0 ${settings.questionSpacing}pt 0; }
        .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
        .question-item { margin-bottom: 0.8em; }
        
        .no-print { display: none; }
        .image-options { grid-template-columns: 1fr 1fr; }
        .image-options img { max-height: 40mm; }
    `;

    let bodyContent = pages.map((pageHtml, index) => {
        const pageElements = elements.filter(el => el.pageIndex === index).map(el => {
             const styles = el.styles;
             // Convert styles to inline string
             let styleStr = `left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;`;
             if (styles.border) styleStr += `border: ${styles.border};`;
             
             let innerContent = '';
             if (el.type === 'text') {
                 styleStr += `font-size: ${styles.fontSize}pt; font-weight: ${styles.fontWeight}; text-align: ${styles.textAlign}; color: ${styles.color}; text-decoration: ${styles.textDecoration};`;
                 innerContent = el.content; // Plain text for now
             } else if (el.type === 'shape') {
                  if (el.shapeType === 'rectangle') {
                      innerContent = `<svg width="100%" height="100%"><rect width="100%" height="100%" fill="${styles.backgroundColor}" stroke="${styles.borderColor}" stroke-width="${styles.borderWidth}" /></svg>`;
                  } else if (el.shapeType === 'circle') {
                       innerContent = `<svg width="100%" height="100%"><ellipse cx="50%" cy="50%" rx="49%" ry="49%" fill="${styles.backgroundColor}" stroke="${styles.borderColor}" stroke-width="${styles.borderWidth}" /></svg>`;
                  }
             }

             return `<div class="draggable-element" style="${styleStr}">${innerContent}</div>`;
        }).join('');

        return `
            <div class="print-page">
                <div class="element-layer" style="z-index: 0;">${pageElements}</div>
                <div class="content-layer" style="z-index: 1;">${pageHtml}</div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${style}</style></head><body>${bodyContent}</body></html>`;
}

export function buildContinuousPrintHtml(pages: string[], _elements: DraggableElementData[], settings: PageStyleSettings): string {
    const fullContent = pages.join('');
    
    let style = `
        @page { size: ${settings.paperSize} ${settings.orientation}; margin: ${settings.margin}mm; }
        body { 
            margin: 0; 
            font-family: sans-serif; 
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineHeight};
        }
        p { margin: 0 0 ${settings.questionSpacing}pt 0; }
        .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
        .question-item { margin-bottom: 0.8em; }
        .page-break { display: none; }
        .no-print { display: none; }
    `;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${style}</style></head><body>${fullContent}</body></html>`;
}

export function buildAnswerPrintHtml(htmlContent: string, columns: number = 2): string {
    let style = `
        @page { size: A4; margin: 20mm; }
        body { margin: 0; padding: 20px; font-family: sans-serif; }
        h2 { text-align: center; }
        .answer-sheet-instance { break-after: page; }
        .answer-sheet-instance:last-child { break-after: auto; }
        
        .answer-grid {
            display: grid;
            grid-template-columns: ${columns === 2 ? '1fr 1fr' : '1fr'};
            column-gap: 2rem;
            row-gap: 0;
        }
        
        .answer-item {
            display: flex;
            align-items: baseline;
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
            break-inside: avoid;
        }
        
        .answer-number {
            font-weight: bold;
            width: 2.5em;
            flex-shrink: 0;
        }
        .answer-text {
            font-weight: bold;
            margin-right: 0.5em;
        }
        .answer-word-id {
            font-size: 0.85em;
            color: #666;
            margin-left: 0.5em;
        }
        .listening-script {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            font-size: 0.85em;
            background-color: #f5f5f5;
        }
    `;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${style}</style></head><body>${htmlContent}</body></html>`;
}

export function buildCopyableHtml(pages: string[], _elements: DraggableElementData[], _settings: PageStyleSettings): string {
    return pages.join('<br><hr><br>');
}
