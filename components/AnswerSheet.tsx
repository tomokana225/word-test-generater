import React from 'react';

interface AnswerSheetProps {
    htmlContent: string;
}

const AnswerSheet: React.FC<AnswerSheetProps> = ({ 
    htmlContent,
}) => {
    return (
        <div 
            className={`bg-white printable-content-wrapper p-6 sm:p-8 rounded-lg shadow-md border border-slate-200`}
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-2xl">英単語テスト - 解答</h2>
            </div>
            
            {/* Render the HTML content passed from the parent */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
    );
};

export default AnswerSheet;