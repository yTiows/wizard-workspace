import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { WindowState, AppId } from '@/types/wizard';
import { useWindowStore, APP_DEFINITIONS } from '@/stores/windowStore';

interface WindowFrameProps {
  window: WindowState;
  children: React.ReactNode;
}

export const WindowFrame = ({ window: win, children }: WindowFrameProps) => {
  const { 
    closeWindow, 
    focusWindow, 
    minimizeWindow, 
    maximizeWindow, 
    restoreWindow,
    moveWindow,
    resizeWindow 
  } = useWindowStore();
  
  const frameRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const app = APP_DEFINITIONS[win.appId as AppId];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return;
    
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    focusWindow(win.id);
  }, [win.id, win.isMaximized, focusWindow]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (win.isMaximized) return;
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: win.width,
      h: win.height,
    });
    focusWindow(win.id);
  }, [win.id, win.width, win.height, win.isMaximized, focusWindow]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, globalThis.innerWidth - 100));
        const newY = Math.max(32, Math.min(e.clientY - dragOffset.y, globalThis.innerHeight - 100));
        moveWindow(win.id, newX, newY);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        resizeWindow(win.id, resizeStart.w + deltaX, resizeStart.h + deltaY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, win.id, moveWindow, resizeWindow]);

  const handleDoubleClick = () => {
    if (win.isMaximized) {
      restoreWindow(win.id);
    } else {
      maximizeWindow(win.id);
    }
  };

  if (win.isMinimized) return null;

  const style = win.isMaximized
    ? { top: 32, left: 0, width: '100%', height: 'calc(100% - 32px - 72px)' }
    : { top: win.y, left: win.x, width: win.width, height: win.height };

  return (
    <motion.div
      ref={frameRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`fixed window flex flex-col ${win.isFocused ? 'border-terminal-dim' : ''}`}
      style={{ ...style, zIndex: win.zIndex }}
      onClick={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className={`window-header cursor-move ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{app.icon}</span>
          <span className="text-sm text-foreground-muted truncate">{win.title}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-background-overlay text-foreground-muted hover:text-foreground transition-colors"
          >
            <span className="text-xs">─</span>
          </button>
          
          {/* Maximize/Restore */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              win.isMaximized ? restoreWindow(win.id) : maximizeWindow(win.id);
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-background-overlay text-foreground-muted hover:text-foreground transition-colors"
          >
            <span className="text-xs">{win.isMaximized ? '◱' : '□'}</span>
          </button>
          
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-danger text-foreground-muted hover:text-white transition-colors"
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-background">
        {children}
      </div>

      {/* Resize handle */}
      {!win.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="absolute bottom-0.5 right-0.5 w-3 h-3 text-foreground-subtle"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H18V22H22V18ZM18 22H14V18H18V22ZM22 14H14V22H22V14Z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
};
