
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
};

const questionOrder: string[] = ['translation', 'reverseTranslation', 'multipleChoice', 'fillInTheBlank', 'synonym', 'antonym'];

export function buildTestHtml(questions: Question[]): string {
    let html = '';
    let globalIndex = 1;

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
        // Flattened structure: No wrapper divs around sections to allow better pagination
        html += `<div class="section-title" style="font-weight: bold; font-size: 1.05em; margin-top: 15px; margin-bottom: 5px;">[${type}] ${questionTypeTitles[type]}</div>`;
        
        typeQuestions.forEach((q) => {
            html += `<div class="question-item" style="margin-bottom: 0.8em;">`;
            
            // Question Prompt
            html += `<div class="question-text" style="display: flex; align-items: baseline;">
                <span class="question-number" style="margin-right: 8px; font-weight: normal;">${globalIndex}.</span>
                <span style="flex: 1;">${processPrompt(q.prompt || q.promptWord || '')}</span>
            </div>`;

            // Options for multiple choice types
            if (['multipleChoice', 'synonym', 'antonym'].includes(q.type) && q.options) {
                html += `<div class="options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px; margin-left: 24px; font-size: 0.95em;">`;
                q.options.forEach((opt, idx) => {
                    const label = String.fromCharCode(97 + idx); // a, b, c, d
                    html += `<div>${label}) ${escapeHtml(opt)}</div>`;
                });
                html += `</div>`;
            } else if (q.type === 'translation' || q.type === 'fillInTheBlank' || q.type === 'reverseTranslation') {
                 // Add a little space for writing if needed, but margin-bottom usually suffices
            }

            html += `</div>`;
            globalIndex++;
        });
    });

    return html;
}

export function buildTestBatchHtml(testBatch: GeneratedTestData[]): string {
    // Flatten the batch structure as well. 
    // Instead of wrapping each test in a div, we output titles and questions directly.
    // We add margin-top to titles (except the first one) to separate tests.
    return testBatch.map((data, index) => {
         const marginTop = index > 0 ? 'margin-top: 30mm;' : '';
         const titleHtml = `<h1 style="text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 1em; text-decoration: underline; ${marginTop}">${escapeHtml(data.title)}</h1>`;
         const contentHtml = buildTestHtml(data.questions);
         return `${titleHtml}${contentHtml}`;
    }).join('');
}

// --- Answer Sheet Builders ---

export function buildAnswerSheetHtml(data: GeneratedTestData): string {
    let html = `<div class="answer-sheet-instance">`;
    html += `<h2 style="font-size: 1.2em; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px;">${escapeHtml(data.title)} - 解答</h2>`;
    
    // We use a clean structure that CSS can grid-ify
    html += `<div class="answer-grid">`;
    
    data.answers.forEach((ans) => {
        // Retrieve the question to check for options
        const question = data.questions[ans.questionIndex];
        let displayAnswer = escapeHtml(ans.answerText);

        // If the question is multiple choice, find the option index and prepend the label (a, b, c...)
        if (question && ['multipleChoice', 'synonym', 'antonym'].includes(question.type) && question.options) {
            const optionIndex = question.options.indexOf(ans.answerText);
            if (optionIndex !== -1) {
                const label = String.fromCharCode(97 + optionIndex); // a, b, c, d...
                displayAnswer = `${label}) ${displayAnswer}`;
            }
        }

        html += `<div class="answer-item" style="padding: 4px 0; border-bottom: 1px dotted #ccc; display: flex; align-items: baseline;">`;
        html += `<span class="answer-number" style="font-weight: bold; width: 2.5em; flex-shrink: 0;">${ans.questionIndex + 1}.</span>`;
        html += `<span class="answer-text" style="font-weight: bold; margin-right: 0.5em;">${displayAnswer}</span>`;
        if (ans.wordId) {
            html += `<span class="answer-word-id" style="font-size: 0.85em; color: #666; margin-left: 0.5em;">（単語番号：${ans.wordId}）</span>`;
        }
        html += `</div>`;
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
    `;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${style}</style></head><body>${htmlContent}</body></html>`;
}

export function buildCopyableHtml(pages: string[], _elements: DraggableElementData[], _settings: PageStyleSettings): string {
    return pages.join('<br><hr><br>');
}
