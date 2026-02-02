
import React, { useRef, useEffect, forwardRef } from 'react';

interface ContentEditableProps {
    html: string;
    tagName?: string;
    className?: string;
    style?: React.CSSProperties;
    onChange: (html: string) => void;
    onBlur?: () => void;
    onInput?: (e: React.FormEvent<HTMLElement>) => void;
    disabled?: boolean;
}

const ContentEditable = forwardRef<HTMLElement, ContentEditableProps>(({
    html,
    tagName = 'div',
    className,
    style,
    onChange,
    onBlur,
    onInput,
    disabled = false
}, ref) => {
    const internalRef = useRef<HTMLElement>(null);
    const elementRef = (ref as React.MutableRefObject<HTMLElement | null>) || internalRef;
    const lastHtml = useRef(html);

    // Sync innerHTML with prop only if it differs significantly and wasn't just updated by user input
    useEffect(() => {
        if (elementRef.current) {
            const currentHtml = elementRef.current.innerHTML;
            if (html !== currentHtml && html !== lastHtml.current) {
                elementRef.current.innerHTML = html;
            }
            // Always update ref to current prop
            lastHtml.current = html;
        }
    }, [html, elementRef]);

    const handleInput = (e: React.FormEvent<HTMLElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        lastHtml.current = newHtml;
        onChange(newHtml);
        if (onInput) onInput(e);
    };

    const Tag = tagName as React.ElementType;

    return (
        <Tag
            ref={elementRef}
            className={className}
            style={style}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={onBlur}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
});

export default ContentEditable;