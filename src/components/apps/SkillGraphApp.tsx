import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/lib/utils';
import type { SkillNode, Domain, SkillNodeType } from '@/types/wizard';

interface SkillGraphAppProps {
  windowId: string;
}

export const SkillGraphApp = ({ windowId }: SkillGraphAppProps) => {
  const { skillNodes, getNode } = useMissionStore();
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const nodes = Object.values(skillNodes);
  
  const getNodeColor = (node: SkillNode) => {
    if (node.completed) return 'bg-terminal border-terminal';
    if (node.unlocked) return 'bg-terminal/20 border-terminal/50';
    return 'bg-[hsl(var(--background-elevated))] border-[hsl(var(--border))]';
  };
  
  const getTypeIcon = (type: SkillNodeType) => {
    switch (type) {
      case 'core': return '⭐';
      case 'branch': return '🌿';
      case 'gate': return '🚪';
      case 'mastery': return '👑';
      case 'cross_domain': return '🔗';
      case 'challenge': return '⚔️';
    }
  };
  
  const getDomainColor = (domain: Domain) => {
    switch (domain) {
      case 'linux': return 'text-terminal';
      case 'network': return 'text-cyber';
      case 'logs': return 'text-amber';
      case 'web': return 'text-purple';
      case 'opsec': return 'text-danger';
      case 'programming': return 'text-blue-400';
      case 'cloud': return 'text-cyan-400';
      case 'forensics': return 'text-orange-400';
      case 'crypto': return 'text-pink-400';
      case 'memory': return 'text-red-400';
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
  };
  
  // Draw connections between nodes
  const getConnections = () => {
    const connections: { from: SkillNode; to: SkillNode }[] = [];
    
    nodes.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        const prereq = getNode(prereqId);
        if (prereq) {
          connections.push({ from: prereq, to: node });
        }
      });
    });
    
    return connections;
  };
  
  const connections = getConnections();
  
  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* Graph canvas */}
      <div 
        className="flex-1 relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Zoom/Pan controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            className="w-8 h-8 rounded bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--background-elevated))] transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="w-8 h-8 rounded bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--background-elevated))] transition-colors"
          >
            -
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-3 h-8 rounded bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] flex items-center justify-center text-xs hover:bg-[hsl(var(--background-elevated))] transition-colors"
          >
            Reset
          </button>
          <span className="px-3 h-8 flex items-center text-xs text-foreground-muted">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        
        {/* SVG for connections */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {connections.map((conn, i) => (
            <line
              key={i}
              x1={conn.from.position.x + 50}
              y1={conn.from.position.y + 25}
              x2={conn.to.position.x + 50}
              y2={conn.to.position.y + 25}
              stroke={conn.to.unlocked ? 'hsl(160, 100%, 45%)' : 'hsl(var(--border))'}
              strokeWidth={2}
              strokeDasharray={conn.to.unlocked ? 'none' : '5,5'}
              opacity={conn.to.unlocked ? 0.6 : 0.3}
            />
          ))}
        </svg>
        
        {/* Nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {nodes.map((node) => (
            <motion.button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={cn(
                "absolute w-24 p-3 rounded-lg border-2 transition-all text-center",
                getNodeColor(node),
                selectedNode?.id === node.id && 'ring-2 ring-terminal ring-offset-2 ring-offset-background',
                !node.unlocked && 'opacity-50'
              )}
              style={{
                left: node.position.x,
                top: node.position.y,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-lg mb-1">{getTypeIcon(node.type)}</div>
              <div className="text-xs font-mono truncate">{node.title}</div>
              <div className={cn("text-[10px] capitalize", getDomainColor(node.domain))}>
                {node.domain}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Node detail panel */}
      {selectedNode && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-80 border-l border-[hsl(var(--border))] bg-[hsl(var(--background-surface))] overflow-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{getTypeIcon(selectedNode.type)}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <h2 className="font-display text-xl text-terminal">{selectedNode.title}</h2>
            <p className={cn("text-sm capitalize mt-1", getDomainColor(selectedNode.domain))}>
              {selectedNode.domain} • {selectedNode.difficulty}
            </p>
            
            <p className="text-foreground-muted text-sm mt-4">{selectedNode.description}</p>
            
            {/* Status */}
            <div className="mt-6 p-4 bg-background rounded-lg border border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  selectedNode.completed ? 'bg-terminal' : selectedNode.unlocked ? 'bg-amber' : 'bg-foreground-subtle'
                )} />
                <span className="text-sm">
                  {selectedNode.completed ? 'Completed' : selectedNode.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              
              {!selectedNode.completed && (
                <div className="mt-3">
                  <p className="text-xs text-foreground-subtle">XP Required</p>
                  <p className="text-lg font-mono text-terminal">{selectedNode.xp_required}</p>
                </div>
              )}
            </div>
            
            {/* Prerequisites */}
            {selectedNode.prerequisites.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm text-foreground-subtle mb-2">Prerequisites</h3>
                <div className="space-y-2">
                  {selectedNode.prerequisites.map(prereqId => {
                    const prereq = getNode(prereqId);
                    return prereq ? (
                      <button
                        key={prereqId}
                        onClick={() => setSelectedNode(prereq)}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 rounded text-left text-sm",
                          prereq.completed ? 'bg-terminal/10 text-terminal' : 'bg-background text-foreground-muted'
                        )}
                      >
                        <span>{prereq.completed ? '✓' : '○'}</span>
                        <span>{prereq.title}</span>
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            
            {/* Missions */}
            <div className="mt-6">
              <h3 className="text-sm text-foreground-subtle mb-2">Missions ({selectedNode.missions.length})</h3>
              <div className="space-y-2">
                {selectedNode.missions.map(missionId => (
                  <div
                    key={missionId}
                    className="p-2 rounded bg-background text-foreground-muted text-sm font-mono"
                  >
                    {missionId}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4">
        <h3 className="text-xs text-foreground-subtle mb-2">Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-terminal/50" />
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-foreground-subtle" />
            <span>Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
};
