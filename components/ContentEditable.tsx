
import React, { useRef, useLayoutEffect, forwardRef } from 'react';

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
    const lastHtmlRef = useRef(html);

    // useLayoutEffect runs synchronously after DOM mutations but before paint.
    // This allows us to update the innerHTML if it doesn't match the prop,
    // ensuring the initial render is correct and external updates are applied,
    // while preventing flashes of empty content.
    useLayoutEffect(() => {
        const el = elementRef.current;
        if (!el) return;

        // If the DOM content differs from the prop (and it wasn't just updated by us typing),
        // we update the DOM.
        if (el.innerHTML !== html) {
            el.innerHTML = html;
        }
        
        lastHtmlRef.current = html;
    }, [html]);

    const handleInput = (e: React.FormEvent<HTMLElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        lastHtmlRef.current = newHtml;
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
        />
    );
});

export default ContentEditable;
