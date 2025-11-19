import React, { useState, useEffect } from 'react';

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface ResizableFrameProps {
    box: Box;
    onBoxChange: (newBox: Box) => void;
    pageDimensions: { width: number; height: number };
}

const ResizableFrame: React.FC<ResizableFrameProps> = ({ box, onBoxChange, pageDimensions }) => {
    const [dragState, setDragState] = useState<{ handle: string; startX: number; startY: number } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState) return;

            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;

            let { x, y, width, height } = box;

            if (dragState.handle.includes('r')) {
                width = Math.min(pageDimensions.width - x, Math.max(50, box.width + dx));
            }
            if (dragState.handle.includes('l')) {
                const newWidth = Math.max(50, box.width - dx);
                x = box.x + box.width - newWidth;
                width = newWidth;
            }
            if (dragState.handle.includes('b')) {
                height = Math.min(pageDimensions.height - y, Math.max(50, box.height + dy));
            }
            if (dragState.handle.includes('t')) {
                const newHeight = Math.max(50, box.height - dy);
                y = box.y + box.height - newHeight;
                height = newHeight;
            }

            onBoxChange({ x, y, width, height });

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
    }, [dragState, box, onBoxChange, pageDimensions]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState({ handle, startX: e.clientX, startY: e.clientY });
    };

    const handles: { name: string; cursor: string; position: string }[] = [
        { name: 'tl', cursor: 'nwse-resize', position: 'top-0 left-0' },
        { name: 'tr', cursor: 'nesw-resize', position: 'top-0 right-0' },
        { name: 'bl', cursor: 'nesw-resize', position: 'bottom-0 left-0' },
        { name: 'br', cursor: 'nwse-resize', position: 'bottom-0 right-0' },
    ];

    return (
        <div 
            className="absolute border-2 border-dashed border-indigo-400 pointer-events-none" 
            style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
        >
            {handles.map(h => (
                <div
                    key={h.name}
                    className={`absolute w-3 h-3 bg-white border-2 border-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-auto`}
                    style={{ cursor: h.cursor, ...parsePosition(h.position) }}
                    onMouseDown={(e) => handleMouseDown(e, h.name)}
                />
            ))}
        </div>
    );
};

function parsePosition(position: string): React.CSSProperties {
    const styles: React.CSSProperties = {};
    position.split(' ').forEach(cls => {
        if (cls === 'top-0') styles.top = '0%';
        if (cls === 'left-0') styles.left = '0%';
        if (cls === 'right-0') styles.left = '100%';
        if (cls === 'bottom-0') styles.top = '100%';
    });
    return styles;
}


export default ResizableFrame;
