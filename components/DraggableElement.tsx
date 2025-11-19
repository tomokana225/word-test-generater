import React, { useState, useEffect, useRef } from 'react';
import { DraggableElementData, ElementStyles } from '../types';
import EditableText from './EditableText';
import ElementToolbar from './ElementToolbar';

interface DraggableElementProps {
    element: DraggableElementData;
    onUpdate: (id: string, updates: Partial<DraggableElementData>) => void;
    isActive: boolean;
    onActivate: (id: string) => void;
    onDelete: (id: string) => void;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ element, onUpdate, isActive, onActivate, onDelete }) => {
    const [dragState, setDragState] = useState<{ type: 'move' | 'resize'; startX: number; startY: number; handle?: string } | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState) return;

            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            if (dragState.type === 'move') {
                onUpdate(element.id, { x: element.x + dx, y: element.y + dy });
            } else if (dragState.type === 'resize') {
                let { width, height, x, y } = element;
                if (dragState.handle?.includes('r')) width = Math.max(20, element.width + dx);
                if (dragState.handle?.includes('l')) {
                    width = Math.max(20, element.width - dx);
                    x = element.x + dx;
                }
                if (dragState.handle?.includes('b')) height = Math.max(20, element.height + dy);
                if (dragState.handle?.includes('t')) {
                    height = Math.max(20, element.height - dy);
                    y = element.y + dy;
                }
                onUpdate(element.id, { x, y, width, height });
            }

            setDragState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null);
        };

        const handleMouseUp = () => {
            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, element, onUpdate]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onActivate(element.id);
        // Dragging text elements is handled by the main div wrapper.
        // This avoids conflicts with text selection and double-click.
        if (element.type === 'text') {
            setDragState({ type: 'move', startX: e.clientX, startY: e.clientY });
        }
    };

    const handleShapeMouseDown = (e: React.MouseEvent<SVGElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onActivate(element.id);
        // For shapes, dragging is initiated on the shape itself.
        setDragState({ type: 'move', startX: e.clientX, startY: e.clientY });
    };

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        onActivate(element.id);
        setDragState({ type: 'resize', startX: e.clientX, startY: e.clientY, handle });
    };

    const handleStyleChange = (styleUpdates: Partial<ElementStyles>) => {
        onUpdate(element.id, { styles: { ...element.styles, ...styleUpdates } });
    };
    
    // By stopping the click event from propagating, we prevent the parent container
    // from firing its onClick handler, which is designed to de-select any active element.
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };


    const resizeHandles: { position: string; cursor: string; name: string }[] = [
        { position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'nwse-resize', name: 'tl' },
        { position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'nesw-resize', name: 'tr' },
        { position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2', cursor: 'nesw-resize', name: 'bl' },
        { position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2', cursor: 'nwse-resize', name: 'br' },
    ];
    
    const { styles } = element;

    return (
        <div
            ref={elementRef}
            className={`absolute select-none ${isActive ? 'z-10' : 'z-0'}`}
            style={{ left: element.x, top: element.y, width: element.width, height: element.height, border: styles.border }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {isActive && <ElementToolbar element={element} onStateChange={handleStyleChange} onDelete={() => onDelete(element.id)} />}
            
            {element.type === 'text' && (
                <EditableText
                    initialValue={element.content}
                    onValueChange={(newContent) => onUpdate(element.id, { content: newContent })}
                    className="w-full h-full p-1 box-border"
                    style={{
                        fontSize: `${styles.fontSize}pt`,
                        fontWeight: styles.fontWeight,
                        textAlign: styles.textAlign,
                        color: styles.color,
                        textDecoration: styles.textDecoration,
                    }}
                    isEditing={element.isEditing}
                    setIsEditing={(isEditing) => onUpdate(element.id, { isEditing })}
                />
            )}

            {element.type === 'shape' && (
                 <svg width="100%" height="100%" onMouseDown={handleShapeMouseDown} className="cursor-move">
                    {element.shapeType === 'rectangle' && (
                        <rect
                            x={ (styles.borderWidth || 0) / 2 }
                            y={ (styles.borderWidth || 0) / 2 }
                            width={element.width - (styles.borderWidth || 0)}
                            height={element.height - (styles.borderWidth || 0)}
                            fill={styles.backgroundColor}
                            stroke={styles.borderColor}
                            strokeWidth={styles.borderWidth}
                        />
                    )}
                    {element.shapeType === 'circle' && (
                        <ellipse
                            cx={element.width / 2}
                            cy={element.height / 2}
                            rx={(element.width - (styles.borderWidth || 0)) / 2}
                            ry={(element.height - (styles.borderWidth || 0)) / 2}
                            fill={styles.backgroundColor}
                            stroke={styles.borderColor}
                            strokeWidth={styles.borderWidth}
                        />
                    )}
                </svg>
            )}


            {isActive && (
                <>
                    <div className="absolute inset-0 border-2 border-indigo-500 pointer-events-none"></div>
                    {resizeHandles.map(handle => (
                         <div
                            key={handle.name}
                            className={`absolute w-3 h-3 bg-white border border-indigo-500 rounded-full ${handle.position}`}
                            style={{ cursor: handle.cursor }}
                            onMouseDown={(e) => handleResizeMouseDown(e, handle.name)}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default DraggableElement;