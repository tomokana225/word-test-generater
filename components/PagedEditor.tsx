import { forwardRef } from 'react';
import { PageStyleSettings } from '../types';

interface PagedEditorProps {
    htmlContent: string;
    onContentChange: () => void;
    pageSettings: PageStyleSettings;
    showFormattingMarks: boolean;
}

const PagedEditor = forwardRef<HTMLDivElement, PagedEditorProps>(({
    htmlContent,
    onContentChange,
    pageSettings,
    showFormattingMarks,
}, ref) => {
    
    const handleInput = () => {
        onContentChange();
    };

    const dynamicEditorStyles = `
        .paged-editor {
            font-size: ${pageSettings.fontSize}pt;
            line-height: ${pageSettings.lineHeight};
            outline: none;
            padding: ${pageSettings.margin}mm;
            box-sizing: border-box;
            height: 100%;
            overflow: hidden;
        }
        .paged-editor.show-formatting p::after {
            content: '¶';
            color: #cccccc;
            font-size: 0.8em;
            display: inline-block;
            margin-left: 0.2em;
        }
        .paged-editor p, 
        .paged-editor table, 
        .paged-editor ul, 
        .paged-editor ol {
            margin-top: 0;
            margin-bottom: ${pageSettings.questionSpacing}pt;
        }
        .paged-editor table { width: 100%; border-collapse: collapse; }
        .paged-editor td { width: 25%; vertical-align: top; padding: 0 1em 0 0; }
    `;

    return (
        <>
            <style>{dynamicEditorStyles}</style>
            <div
                ref={ref}
                contentEditable={true}
                suppressContentEditableWarning={true}
                className={`paged-editor ${showFormattingMarks ? 'show-formatting' : ''}`}
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </>
    );
});

export default PagedEditor;