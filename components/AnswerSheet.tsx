
import React from 'react';

interface AnswerSheetProps {
    htmlContent: string;
    columns: number;
}

const AnswerSheet: React.FC<AnswerSheetProps> = ({ 
    htmlContent,
    columns
}) => {
    // Dynamic styles for the grid based on column selection
    const gridStyle = `
        .answer-grid {
            display: grid;
            grid-template-columns: ${columns === 2 ? '1fr 1fr' : '1fr'};
            column-gap: 4rem;
            row-gap: 0;
        }
    `;

    return (
        <div 
            className={`bg-white printable-content-wrapper p-6 sm:p-12 rounded-lg shadow-md border border-slate-200 min-h-[600px]`}
        >
             <style>{gridStyle}</style>
            
            {/* Render the HTML content passed from the parent */}
            <div className="answer-sheet-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
    );
};

export default AnswerSheet;
