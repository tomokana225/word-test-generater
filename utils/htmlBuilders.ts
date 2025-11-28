// FIX: Import missing types DraggableElementData, PageStyleSettings, and Answer to resolve type errors.
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
    // The regex captures content between double underscores
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

const questionOrder: (keyof typeof questionTypeTitles)[] = ['translation', 'reverseTranslation', 'multipleChoice', 'fillInTheBlank', 'synonym', 'antonym'];

export function buildTestHtml(questions: Question[]): string {
    const groupedQuestions: { [key: string]: Question[] } = questions.reduce((acc, q) => {
        (acc[q.type] = acc[q.type] || []).push(q);
        return acc;
    }, {} as { [key: string]: Question[] });

    let finalHtml = '';
    
    let questionCounter = 1;

    for (const type of questionOrder) {
        if (!groupedQuestions[type] || groupedQuestions[type].length === 0) continue;

        finalHtml += `<p class="question-group-title" style="font-weight: bold; margin-top: 2em; margin-bottom: 1em;">${questionTypeTitles[type] || type}</p>`;
        const questionList = groupedQuestions[type];

        questionList.forEach((q) => {
            let questionContent = '';
            switch (q.type) {
                case 'translation':
                case 'reverseTranslation':
                    // These now use the prompt as the full sentence with __markers__
                    questionContent = `<span>${processPrompt(q.prompt || '')}</span>`;
                    break;
                case 'multipleChoice':
                case 'synonym':
                case 'antonym':
                    const tableStyle = "border-collapse: collapse; border: none; background-color: transparent; width: 100%; margin-top: 0.25em;";
                    const cellStyle = "border: none; background-color: transparent; width: 25%; vertical-align: top; padding: 0.25em 1em 0 0;";

                    const optionsCells = (q.options || []).map((opt, i) =>
                        `<td style="${cellStyle}">${String.fromCharCode(97 + i)}) ${escapeHtml(opt)}</td>`
                    ).join('');
                    const tableHtml = `<table style="${tableStyle}"><tbody><tr style="border: none; background-color: transparent;">${optionsCells}</tr></tbody></table>`;
                    // Use promptWord for the single word display, or prompt if promptWord is missing (fallback)
                    questionContent = `<span style="font-weight: 500;">${escapeHtml(q.promptWord || q.prompt || '')}</span>${tableHtml}`;
                    break;
                case 'fillInTheBlank':
                    questionContent = `<span>${escapeHtml(q.prompt || '')} ( ____________________ )</span>`;
                    break;
            }
             finalHtml += `<div class="question-item" style="margin-bottom: 0.8em;"><span style="font-weight: bold; margin-right: 0.5em;">${questionCounter}.</span> ${questionContent}</div>`;
             questionCounter++;
        });
    }
    return finalHtml;
}

export function buildTestBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map(testData => `
        <h2 style="text-align: center; font-size: 1.5em; margin-bottom: 1.5em; page-break-before: always;">英単語テスト: ${escapeHtml(testData.title)}</h2>
        ${buildTestHtml(testData.questions)}
    `).join('<hr style="margin: 3em 0; border: 1px solid #ccc; page-break-after: always;">');
}

export function buildAnswerSheetBatchHtml(testBatch: GeneratedTestData[]): string {
    return testBatch.map(testData => {
        const typeOrderMap = new Map(questionOrder.map((type, index) => [type, index]));

        const sortedAnswers = [...testData.answers].sort((a, b) => {
            const questionA = testData.questions[a.questionIndex];
            const questionB = testData.questions[b.questionIndex];
            
            const typeOrderA = typeOrderMap.get(questionA.type) ?? 99;
            const typeOrderB = typeOrderMap.get(questionB.type) ?? 99;

            if (typeOrderA !== typeOrderB) {
                return typeOrderA - typeOrderB;
            }
            return a.questionIndex - b.questionIndex;
        });

        const answersHtml = sortedAnswers.map((ans, index) => {
             const question = testData.questions[ans.questionIndex];
             let displayAnswer = ans.answerText;
             if (question && (question.type === 'multipleChoice' || question.type === 'synonym' || question.type === 'antonym')) {
                const optionIndex = question.options?.findIndex(opt => opt === ans.answerText);
                if(optionIndex !== -1 && optionIndex !== undefined) {
                    displayAnswer = `${String.fromCharCode(97 + optionIndex)}) ${ans.answerText}`;
                }
             }
             const wordIdSpan = ans.wordId ? ` <span style="font-size: 0.8em; color: #555;">(No.${escapeHtml(ans.wordId)})</span>` : '';
            return `<li style="margin-bottom: 0.25em;"><b>${index + 1}.</b> ${escapeHtml(displayAnswer)}${wordIdSpan}</li>`;
        }).join('');
        
        return `
            <div class="printable-answers" style="page-break-inside: avoid;">
                <h3>解答: ${escapeHtml(testData.title)}</h3>
                <ul style="list-style: none; padding-left: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5em;">${answersHtml}</ul>
            </div>`;
    }).join('<br>');
}


export function buildPrintHtml(pages: string[], elements: DraggableElementData[], pageSettings: PageStyleSettings): string {
    const paperSizeForCss = pageSettings.paperSize === 'Letter' ? 'letter' : pageSettings.paperSize;

    const pageStyles = `
        body { 
            font-family: sans-serif; 
            margin: 0;
        }
        .print-page-container {
            position: relative;
            page-break-after: always;
            overflow: hidden;
        }
        .print-page-container:last-child {
            page-break-after: auto;
        }
        .document-content {
             box-sizing: border-box;
             padding: ${pageSettings.margin}mm;
             font-size: ${pageSettings.fontSize}pt;
             line-height: ${pageSettings.lineHeight};
        }
         .document-content p, .document-content table, .document-content .question-item {
            margin-top: 0;
            margin-bottom: ${pageSettings.questionSpacing}pt;
        }
        .document-content table {
            width: 100%;
            border-collapse: collapse;
        }
        .document-content td {
            width: 25%;
            vertical-align: top;
            padding: 0 1em 0 0;
        }
        .elements-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        @page {
            size: ${paperSizeForCss} ${pageSettings.orientation};
            margin: 0;
        }
    `;

    const pagesHtml = pages.map((pageHtml, index) => {
        const cleanedPageHtml = pageHtml.trim().replace(/(<p>(&nbsp;|\s*|<br\s*\/?>)<\/p>)+$/, '');

        const pageElements = elements.filter(el => el.pageIndex === index);
        const elementsHtml = pageElements.map(el => {
            const style: React.CSSProperties = {
                position: 'absolute', left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: `${el.height}px`,
                fontSize: `${el.styles.fontSize}pt`, fontWeight: el.styles.fontWeight, textAlign: el.styles.textAlign,
                color: el.styles.color, textDecoration: el.styles.textDecoration, backgroundColor: el.styles.backgroundColor,
                border: `${el.styles.borderWidth}px solid ${el.styles.borderColor}`, boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: el.styles.textAlign
            };
            const styleString = Object.entries(style).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join(' ');
            
            if (el.type === 'text') {
                return `<div style="${styleString}">${el.content}</div>`;
            }
            if (el.type === 'shape') {
                const shapeStyleString = styleString + (el.shapeType === 'circle' ? 'border-radius: 50%;' : '');
                return `<div style="${shapeStyleString}"></div>`;
            }
            return '';
        }).join('');

        return `
            <div class="print-page-container">
                <div class="document-content">${cleanedPageHtml}</div>
                <div class="elements-overlay">${elementsHtml}</div>
            </div>
        `;
    }).join('');

    return `
        <html>
            <head>
                <title>印刷</title>
                <style>${pageStyles}</style>
            </head>
            <body>
                ${pagesHtml}
            </body>
        </html>
    `;
}


export function buildCopyableHtml(pages: string[], elements: DraggableElementData[], pageSettings: PageStyleSettings): string {
    const firstPageElements = elements.filter(el => el.pageIndex === 0);
    const sortedElements = [...firstPageElements].sort((a, b) => a.y - b.y);

    const elementsHtml = sortedElements.map(el => {
        const style: React.CSSProperties = {
            marginBottom: '10pt',
            width: `${el.width}px`,
            minHeight: el.type === 'shape' ? `${el.height}px` : undefined,
            boxSizing: 'border-box',
            fontSize: `${el.styles.fontSize}pt`,
            fontWeight: el.styles.fontWeight,
            textAlign: el.styles.textAlign,
            color: el.styles.color,
            textDecoration: el.styles.textDecoration,
            backgroundColor: el.styles.backgroundColor,
            border: `${el.styles.borderWidth}px solid ${el.styles.borderColor}`,
            borderRadius: el.shapeType === 'circle' ? '50%' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.styles.textAlign,
        };
        
        const styleString = Object.entries(style)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`)
            .join(' ');

        return `<div style="${styleString}">${el.content || '&nbsp;'}</div>`;
    }).join('\n');

    const sharedStyles = `
        body { 
            font-family: sans-serif; 
            font-size: ${pageSettings.fontSize}pt; 
            line-height: ${pageSettings.lineHeight};
        }
        p, .question-item {
            margin-top: 0;
            margin-bottom: ${pageSettings.questionSpacing}pt;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.25em;
            margin-bottom: ${pageSettings.questionSpacing}pt;
        }
        td {
            width: 25%;
            vertical-align: top;
            padding: 0 1em 0 0;
        }
    `;

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Copied Content</title>
                <style>${sharedStyles}</style>
            </head>
            <body>
                <div class="elements-header">
                    ${elementsHtml}
                </div>
                ${elementsHtml ? '<br>' : ''}
                <div class="main-document">
                    ${pages.join(' ')}
                </div>
            </body>
        </html>
    `;
}


export function buildAnswerSheetHtml(answers: Answer[], questions: Question[]): string {
    const answersHtml = answers.map((ans, index) => {
         const question = questions[ans.questionIndex];
         let displayAnswer = ans.answerText;
         if (question && (question.type === 'multipleChoice' || question.type === 'synonym' || question.type === 'antonym')) {
            const optionIndex = question.options?.findIndex(opt => opt === ans.answerText);
            if(optionIndex !== -1 && optionIndex !== undefined) {
                displayAnswer = `${String.fromCharCode(97 + optionIndex)}) ${ans.answerText}`;
            }
         }
         const wordIdSpan = ans.wordId ? ` <span style="font-size: 0.8em; color: #555;">(No.${escapeHtml(ans.wordId)})</span>` : '';
        return `<li><b>${index + 1}.</b> ${escapeHtml(displayAnswer)}${wordIdSpan}</li>`;
    }).join('');

    return `
        <div class="printable-answers">
            <h1>解答</h1>
            <ul style="list-style: none; padding-left: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5em;">${answersHtml}</ul>
        </div>
    `;
}