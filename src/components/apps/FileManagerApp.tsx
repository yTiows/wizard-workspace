import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilesystemStore } from '@/stores/filesystemStore';
import { cn } from '@/lib/utils';

interface FileManagerAppProps {
  windowId: string;
}

export const FileManagerApp = ({ windowId }: FileManagerAppProps) => {
  const store = useFilesystemStore();
  const { 
    getChildren, 
    getNodeByPath, 
    setCurrentDirectory,
    createFile,
    createDirectory,
    deleteNode,
    readFile,
    getParentPath,
  } = store;
  
  const currentDirectory = store.filesystem?.currentDirectory || '/home/user';
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  const currentNode = getNodeByPath(currentDirectory);
  const children = currentNode ? getChildren(currentNode.id) : [];
  
  const handleNavigate = (path: string) => {
    setCurrentDirectory(path);
    setSelectedFile(null);
    setPreviewContent(null);
  };
  
  const handleFileClick = (node: ReturnType<typeof getNodeByPath>) => {
    if (!node) return;
    
    if (node.type === 'directory') {
      handleNavigate(node.path);
    } else {
      setSelectedFile(node.id);
      const content = readFile(node.path);
      setPreviewContent(content || '');
    }
  };
  
  const handleGoUp = () => {
    const parent = getParentPath(currentDirectory);
    if (parent) {
      handleNavigate(parent);
    }
  };
  
  const handleCreateItem = () => {
    if (!newItemName.trim() || !showNewDialog) return;
    
    const path = `${currentDirectory === '/' ? '' : currentDirectory}/${newItemName}`;
    
    if (showNewDialog === 'folder') {
      createDirectory(path);
    } else {
      createFile(path, '', 'user');
    }
    
    setNewItemName('');
    setShowNewDialog(null);
  };
  
  const handleDelete = () => {
    if (!selectedFile) return;
    deleteNode(selectedFile);
    setSelectedFile(null);
    setPreviewContent(null);
  };
  
  const pathParts = currentDirectory.split('/').filter(Boolean);
  
  const getFileIcon = (node: ReturnType<typeof getNodeByPath>) => {
    if (!node) return '📄';
    if (node.type === 'directory') return '📁';
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt': return '📝';
      case 'md': return '📋';
      case 'js':
      case 'ts':
      case 'tsx': return '⚡';
      case 'json': return '🔧';
      case 'sh': return '🖥️';
      case 'log': return '📊';
      default: return '📄';
    }
  };
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-surface))]">
        <button
          onClick={handleGoUp}
          disabled={currentDirectory === '/'}
          className="p-2 rounded hover:bg-[hsl(var(--background-elevated))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Go up"
        >
          ⬆️
        </button>
        
        <button
          onClick={() => handleNavigate('/home/user')}
          className="p-2 rounded hover:bg-[hsl(var(--background-elevated))] transition-colors"
          title="Home"
        >
          🏠
        </button>
        
        <div className="flex-1 flex items-center gap-1 px-3 py-1.5 bg-background rounded border border-[hsl(var(--border))] font-mono text-sm">
          <span 
            className="text-terminal cursor-pointer hover:underline"
            onClick={() => handleNavigate('/')}
          >
            /
          </span>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center">
              <span 
                className="text-terminal cursor-pointer hover:underline"
                onClick={() => handleNavigate('/' + pathParts.slice(0, i + 1).join('/'))}
              >
                {part}
              </span>
              {i < pathParts.length - 1 && <span className="text-foreground-subtle mx-1">/</span>}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-1 border-l border-[hsl(var(--border))] pl-2">
          <button
            onClick={() => setShowNewDialog('file')}
            className="p-2 rounded hover:bg-[hsl(var(--background-elevated))] transition-colors"
            title="New file"
          >
            📄+
          </button>
          <button
            onClick={() => setShowNewDialog('folder')}
            className="p-2 rounded hover:bg-[hsl(var(--background-elevated))] transition-colors"
            title="New folder"
          >
            📁+
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedFile}
            className="p-2 rounded hover:bg-danger/20 disabled:opacity-50 transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
        
        <div className="flex items-center border-l border-[hsl(var(--border))] pl-2">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === 'list' ? 'bg-terminal/20 text-terminal' : 'hover:bg-[hsl(var(--background-elevated))]'
            )}
          >
            ≡
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded transition-colors",
              viewMode === 'grid' ? 'bg-terminal/20 text-terminal' : 'hover:bg-[hsl(var(--background-elevated))]'
            )}
          >
            ⊞
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File list */}
        <div className="flex-1 overflow-auto p-2">
          {viewMode === 'list' ? (
            <table className="w-full text-sm">
              <thead className="text-left text-foreground-subtle border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="pb-2 font-normal">Name</th>
                  <th className="pb-2 font-normal w-24">Size</th>
                  <th className="pb-2 font-normal w-32">Modified</th>
                  <th className="pb-2 font-normal w-24">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {children.map((node) => (
                  <tr
                    key={node.id}
                    onClick={() => handleFileClick(node)}
                    onDoubleClick={() => node.type === 'directory' && handleNavigate(node.path)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedFile === node.id 
                        ? 'bg-terminal/20 text-terminal' 
                        : 'hover:bg-[hsl(var(--background-elevated))]'
                    )}
                  >
                    <td className="py-1.5 flex items-center gap-2">
                      <span>{getFileIcon(node)}</span>
                      <span className="font-mono">{node.name}</span>
                    </td>
                    <td className="py-1.5 text-foreground-muted font-mono">
                      {node.type === 'file' ? formatSize(node.size) : '-'}
                    </td>
                    <td className="py-1.5 text-foreground-muted">
                      {formatDate(node.modified)}
                    </td>
                    <td className="py-1.5 text-foreground-subtle font-mono text-xs">
                      {node.permissions}
                    </td>
                  </tr>
                ))}
                
                {children.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-foreground-muted">
                      Empty directory
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {children.map((node) => (
                <motion.div
                  key={node.id}
                  onClick={() => handleFileClick(node)}
                  onDoubleClick={() => node.type === 'directory' && handleNavigate(node.path)}
                  className={cn(
                    "p-4 rounded-lg cursor-pointer text-center transition-colors",
                    selectedFile === node.id 
                      ? 'bg-terminal/20 border border-terminal' 
                      : 'hover:bg-[hsl(var(--background-elevated))] border border-transparent'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">{getFileIcon(node)}</div>
                  <div className="font-mono text-sm truncate">{node.name}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Preview panel */}
        {previewContent !== null && (
          <div className="w-80 border-l border-[hsl(var(--border))] bg-[hsl(var(--background-surface))] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <span className="font-mono text-sm text-terminal">Preview</span>
              <button
                onClick={() => {
                  setPreviewContent(null);
                  setSelectedFile(null);
                }}
                className="text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <pre className="font-mono text-xs text-foreground-muted whitespace-pre-wrap">
                {previewContent || '(empty file)'}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--background-surface))] text-xs text-foreground-muted">
        <span>{children.length} items</span>
        <span>{currentDirectory}</span>
      </div>
      
      {/* New file/folder dialog */}
      <AnimatePresence>
        {showNewDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 flex items-center justify-center"
            onClick={() => setShowNewDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-6 w-80"
            >
              <h3 className="font-display text-lg text-terminal mb-4">
                New {showNewDialog === 'folder' ? 'Folder' : 'File'}
              </h3>
              
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={showNewDialog === 'folder' ? 'folder_name' : 'filename.txt'}
                className="w-full bg-background border border-[hsl(var(--border))] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-terminal"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowNewDialog(null)}
                  className="flex-1 py-2 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--background-elevated))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateItem}
                  disabled={!newItemName.trim()}
                  className="flex-1 py-2 rounded bg-terminal text-background font-medium disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
