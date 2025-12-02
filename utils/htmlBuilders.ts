
import { Question, GeneratedTestData, DraggableElementData, PageStyleSettings, Answer } from '../types';

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

        // Section Title - flattened
        // Using a plain div instead of nested section to allow pagination to split cleanly
        html += `<div class="section-title" style="font-weight: bold; font-size: 1.05em; margin-top: 15px; margin-bottom: 5px; break-after: avoid; page-break-after: avoid;">[${type}] ${questionTypeTitles[type]}</div>`;

        typeQuestions.forEach(q => {
            // Updated style: 
            // 1. Reduced margin-bottom to 5px to fit more questions.
            // 2. margin-top: 0 to avoid blank lines at page tops.
            // 3. break-inside: avoid to keep question blocks together.
            html += `<div class="question-item" style="margin-bottom: 5px; margin-top: 0; page-break-inside: avoid; break-inside: avoid;">`;
            
            // Question prompt
            // Removed font-weight: bold from the number by explicitly setting normal
            html += `<div style="margin-bottom: 2px;">
                <span style="margin-right: 6px; font-weight: normal;">${globalIndex}.</span>
                ${q.prompt ? processPrompt(q.prompt) : processPrompt(q.promptWord || '')}
            </div>`;

            // Options for multiple choice/synonym/antonym
            if (['multipleChoice', 'synonym', 'antonym'].includes(q.type) && q.options) {
                html += `<div style="margin-left: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px;">`;
                q.options.forEach((opt, idx) => {
                    const label = String.fromCharCode(97 + idx); // a, b, c, d
                    html += `<div>${label}) ${escapeHtml(opt)}</div>`;
                });
                html += `</div>`;
            }

            html += `</div>`; // End question-item
            globalIndex++;
        });
    });

    return html;
}

export function buildTestBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map(data => {
        // Return a flattened structure (h1 + content) without a wrapping div.
        // This allows the paginator to treat the header and individual questions as separate nodes,
        // enabling proper flow across pages and preventing large blank spaces at the bottom.
        return `
            <h1 class="test-title" style="text-align: center; font-size: 1.4em; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; width: 100%; margin-top: 0;">${escapeHtml(data.title)}</h1>
            ${buildTestHtml(data.questions)}
            <div class="test-separator" style="height: 20px; width: 100%;"></div>
        `;
    }).join('');
}

export function buildAnswerSheetHtml(answers: Answer[], title: string): string {
    let html = `<div class="answer-sheet" style="page-break-inside: avoid;">
        <h2 style="font-size: 1.2em; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${escapeHtml(title)} - 解答</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; font-size: 0.9em;">`;
    
    answers.forEach(a => {
        const wordIdHtml = a.wordId ? `<span style="font-size: 0.85em; color: #666; margin-left: 4px;">(単語番号：${escapeHtml(a.wordId)})</span>` : '';
        html += `<div style="border-bottom: 1px dotted #ccc; padding: 2px;">
            <span style="font-weight: bold; margin-right: 8px;">${a.questionIndex + 1}.</span>
            ${escapeHtml(a.answerText)}${wordIdHtml}
        </div>`;
    });

    html += `</div></div>`;
    return html;
}

export function buildAnswerSheetBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map(data => buildAnswerSheetHtml(data.answers, data.title)).join('<hr style="margin: 20px 0; border: 0; border-top: 1px dashed #ccc;" />');
}

export function buildPrintHtml(pages: string[], elements: DraggableElementData[], settings: PageStyleSettings): string {
    // Generate CSS for page size and elements
    const style = `
        @page { size: ${settings.paperSize} ${settings.orientation}; margin: 0; }
        body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; }
        .print-page {
            position: relative;
            width: ${settings.orientation === 'portrait' ? '210mm' : '297mm'}; /* Approximate for A4, handled by @page mostly */
            height: ${settings.orientation === 'portrait' ? '297mm' : '210mm'};
            page-break-after: always;
            overflow: hidden;
            box-sizing: border-box;
            padding: ${settings.margin}mm;
        }
        .print-content {
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineHeight};
            width: 100%;
            height: 100%;
        }
        .element { position: absolute; }
    `;

    let html = `<!DOCTYPE html><html><head><style>${style}</style></head><body>`;

    pages.forEach((pageHtml, index) => {
        html += `<div class="print-page">`;
        html += `<div class="print-content">${pageHtml}</div>`;
        
        // Render elements for this page
        const pageElements = elements.filter(el => el.pageIndex === index);
        pageElements.forEach(el => {
            const { x, y, width, height, styles, content, type, shapeType } = el;
            
            let elStyle = `left:${x}px; top:${y}px; width:${width}px; height:${height}px;`;
            if (styles.border) elStyle += `border:${styles.border};`;
            
            if (type === 'text') {
                 elStyle += `font-size:${styles.fontSize}pt; font-weight:${styles.fontWeight}; text-align:${styles.textAlign}; color:${styles.color}; text-decoration:${styles.textDecoration}; display: flex; align-items: center;`;
                 html += `<div class="element" style="${elStyle}">${escapeHtml(content)}</div>`;
            } else if (type === 'shape') {
                 html += `<div class="element" style="${elStyle}">
                    <svg width="100%" height="100%">
                        ${shapeType === 'circle' 
                            ? `<ellipse cx="50%" cy="50%" rx="${(width - (styles.borderWidth||0))/2}" ry="${(height - (styles.borderWidth||0))/2}" fill="${styles.backgroundColor}" stroke="${styles.borderColor}" stroke-width="${styles.borderWidth}" />`
                            : `<rect x="${(styles.borderWidth||0)/2}" y="${(styles.borderWidth||0)/2}" width="${width - (styles.borderWidth||0)}" height="${height - (styles.borderWidth||0)}" fill="${styles.backgroundColor}" stroke="${styles.borderColor}" stroke-width="${styles.borderWidth}" />`
                        }
                    </svg>
                 </div>`;
            }
        });

        html += `</div>`;
    });

    html += `</body></html>`;
    return html;
}

export function buildContinuousPrintHtml(pages: string[], _elements: DraggableElementData[], settings: PageStyleSettings): string {
    const style = `
        @page { size: auto; margin: ${settings.margin}mm; }
        body { font-family: sans-serif; line-height: ${settings.lineHeight}; font-size: ${settings.fontSize}pt; }
        .question-item { break-inside: avoid; page-break-inside: avoid; }
    `;
    return `<html><head><style>${style}</style></head><body>${pages.join('')}</body></html>`;
}

export function buildCopyableHtml(pages: string[], _elements: DraggableElementData[], _settings: PageStyleSettings): string {
    return pages.join('<br/><br/>');
}
