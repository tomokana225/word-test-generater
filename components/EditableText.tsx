import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
    initialValue: string;
    onValueChange: (newValue: string) => void;
    className?: string;
    style?: React.CSSProperties;
    isEditing: boolean;
    setIsEditing: (isEditing: boolean) => void;
}

const EditableText: React.FC<EditableTextProps> = ({
    initialValue,
    onValueChange,
    className,
    style,
    isEditing,
    setIsEditing,
}) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        onValueChange(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setValue(initialValue);
            setIsEditing(false);
        }
    };
    
    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    }, [isEditing, value]);


    if (isEditing) {
        return (
            <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`${className} resize-none outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm`}
                style={style}
            />
        );
    }

    return (
        <div
            onDoubleClick={() => setIsEditing(true)}
            className={`${className} cursor-pointer hover:bg-slate-100 rounded-sm w-full h-full`}
            style={{ 
                ...style,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: (style as any)?.textAlign || 'left'
            }}
        >
            {value || 'クリックして編集'}
        </div>
    );
};

export default EditableText;