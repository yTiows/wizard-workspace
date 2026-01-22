import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/lib/utils';
import type { Mission, Difficulty, Domain } from '@/types/wizard';

interface MissionControlAppProps {
  windowId: string;
}

export const MissionControlApp = ({ windowId }: MissionControlAppProps) => {
  const store = useMissionStore();
  const {
    missions,
    activeMission,
    missionProgress,
    getMission,
    getAvailableMissions,
    startMission,
    abandonMission,
  } = store;
  
  const currentMission = activeMission;
  const currentProgress = missionProgress;
  
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [filter, setFilter] = useState<Difficulty | 'all'>('all');
  
  const availableMissions = getAvailableMissions();
  const filteredMissions = filter === 'all' 
    ? availableMissions 
    : availableMissions.filter(m => m.difficulty === filter);
  
  const activeMission = currentMission ? getMission(currentMission) : null;
  
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-terminal';
      case 'intermediate': return 'text-amber';
      case 'advanced': return 'text-danger';
    }
  };
  
  const getDomainIcon = (domain: Domain) => {
    switch (domain) {
      case 'linux': return '🐧';
      case 'network': return '🌐';
      case 'logs': return '📊';
      case 'web': return '🕸️';
      case 'opsec': return '🛡️';
      case 'programming': return '💻';
      case 'cloud': return '☁️';
      case 'forensics': return '🔍';
      case 'crypto': return '🔐';
      case 'memory': return '🧠';
    }
  };
  
  const handleStartMission = (missionId: string) => {
    startMission(missionId);
    setSelectedMission(null);
  };
  
  return (
    <div className="h-full flex bg-background">
      {/* Mission list */}
      <div className="w-80 border-r border-[hsl(var(--border))] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-surface))]">
          <h2 className="font-display text-lg text-terminal tracking-wider">MISSIONS</h2>
          
          {/* Filters */}
          <div className="flex gap-2 mt-3">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors capitalize",
                  filter === f
                    ? 'bg-terminal/20 text-terminal'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        {/* Active mission indicator */}
        {activeMission && (
          <div className="p-3 bg-terminal/10 border-b border-terminal/30">
            <div className="flex items-center gap-2 text-terminal text-sm">
              <div className="w-2 h-2 rounded-full bg-terminal animate-pulse" />
              <span className="font-mono">Active: {activeMission.title}</span>
            </div>
          </div>
        )}
        
        {/* Mission list */}
        <div className="flex-1 overflow-auto">
          {filteredMissions.map((mission) => (
            <motion.button
              key={mission.mission_id}
              onClick={() => setSelectedMission(mission)}
              className={cn(
                "w-full p-4 text-left border-b border-[hsl(var(--border))] transition-colors",
                selectedMission?.mission_id === mission.mission_id
                  ? 'bg-terminal/10 border-l-2 border-l-terminal'
                  : 'hover:bg-[hsl(var(--background-surface))]',
                currentMission === mission.mission_id && 'bg-terminal/5'
              )}
              whileHover={{ x: 2 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-sm text-foreground">{mission.title}</h3>
                  <p className={cn("text-xs mt-1 capitalize", getDifficultyColor(mission.difficulty))}>
                    {mission.difficulty}
                  </p>
                </div>
                <div className="flex gap-1">
                  {mission.domains.slice(0, 2).map((domain) => (
                    <span key={domain} title={domain}>
                      {getDomainIcon(domain)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-foreground-subtle">
                <span>+{mission.rewards.xp} XP</span>
                <span>•</span>
                <span>{mission.objectives.length} objectives</span>
              </div>
            </motion.button>
          ))}
          
          {filteredMissions.length === 0 && (
            <div className="p-8 text-center text-foreground-muted">
              <p>No missions available</p>
              <p className="text-xs mt-1 text-foreground-subtle">
                Complete prerequisites to unlock more
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mission details */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedMission ? (
            <MissionDetail
              key={selectedMission.mission_id}
              mission={selectedMission}
              isActive={currentMission === selectedMission.mission_id}
              progress={currentMission === selectedMission.mission_id ? currentProgress : null}
              onStart={() => handleStartMission(selectedMission.mission_id)}
              onAbandon={abandonMission}
              getDifficultyColor={getDifficultyColor}
              getDomainIcon={getDomainIcon}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center text-center"
            >
              <div>
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="font-display text-xl text-foreground-muted">Select a Mission</h3>
                <p className="text-foreground-subtle text-sm mt-2">
                  Choose a mission from the list to view details
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Mission Detail Component
const MissionDetail = ({
  mission,
  isActive,
  progress,
  onStart,
  onAbandon,
  getDifficultyColor,
  getDomainIcon,
}: {
  mission: Mission;
  isActive: boolean;
  progress: ReturnType<typeof useMissionStore>['currentProgress'];
  onStart: () => void;
  onAbandon: () => void;
  getDifficultyColor: (d: Difficulty) => string;
  getDomainIcon: (d: Domain) => string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-auto"
    >
      {/* Header */}
      <div className="p-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-surface))]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {mission.domains.map((domain) => (
                <span key={domain} className="text-2xl" title={domain}>
                  {getDomainIcon(domain)}
                </span>
              ))}
            </div>
            <h1 className="font-display text-2xl text-terminal">{mission.title}</h1>
            <p className={cn("text-sm mt-1 capitalize", getDifficultyColor(mission.difficulty))}>
              {mission.difficulty} • +{mission.rewards.xp} XP
            </p>
          </div>
          
          {isActive ? (
            <button
              onClick={onAbandon}
              className="px-4 py-2 rounded border border-danger text-danger hover:bg-danger/10 text-sm transition-colors"
            >
              Abandon Mission
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-6 py-2 rounded bg-terminal text-background font-display uppercase tracking-wider text-sm hover:bg-terminal/90 transition-colors"
            >
              Start Mission
            </button>
          )}
        </div>
      </div>
      
      {/* Briefing */}
      <div className="p-6 space-y-6">
        <section>
          <h2 className="font-display text-lg text-terminal mb-3 tracking-wider">BRIEFING</h2>
          <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4">
            <p className="text-foreground-muted">{mission.briefing.context}</p>
            <p className="text-amber text-sm mt-3 font-mono">⚠ {mission.briefing.stakes}</p>
          </div>
        </section>
        
        {/* Objectives */}
        <section>
          <h2 className="font-display text-lg text-terminal mb-3 tracking-wider">OBJECTIVES</h2>
          <div className="space-y-2">
            {mission.objectives.map((obj, i) => {
              const isCompleted = progress?.objectives_completed.includes(obj.id);
              return (
                <div
                  key={obj.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded border",
                    isCompleted
                      ? 'bg-terminal/10 border-terminal/30'
                      : 'bg-[hsl(var(--background-surface))] border-[hsl(var(--border))]'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center text-xs font-mono",
                    isCompleted
                      ? 'bg-terminal text-background'
                      : 'border border-foreground-muted text-foreground-muted'
                  )}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm",
                      isCompleted ? 'text-terminal' : 'text-foreground'
                    )}>
                      {obj.text}
                    </p>
                    {!obj.required && (
                      <span className="text-xs text-foreground-subtle">(Optional)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        
        {/* Constraints */}
        <section>
          <h2 className="font-display text-lg text-terminal mb-3 tracking-wider">CONSTRAINTS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4">
              <h3 className="text-xs text-foreground-subtle uppercase tracking-wider mb-2">Allowed Apps</h3>
              <div className="flex flex-wrap gap-2">
                {mission.constraints.allowed_apps.map((app) => (
                  <span key={app} className="px-2 py-1 bg-terminal/10 text-terminal text-xs rounded capitalize">
                    {app}
                  </span>
                ))}
              </div>
            </div>
            
            {mission.constraints.restricted_apps.length > 0 && (
              <div className="bg-[hsl(var(--background-surface))] border border-danger/30 rounded-lg p-4">
                <h3 className="text-xs text-danger uppercase tracking-wider mb-2">Restricted</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.constraints.restricted_apps.map((app) => (
                    <span key={app} className="px-2 py-1 bg-danger/10 text-danger text-xs rounded capitalize">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Requirements */}
        <section>
          <h2 className="font-display text-lg text-terminal mb-3 tracking-wider">REQUIREMENTS</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4 text-center">
              <p className="text-2xl font-mono text-terminal">
                {progress?.terminal_commands || 0}/{mission.requirements.min_terminal_commands}
              </p>
              <p className="text-xs text-foreground-subtle mt-1">Terminal Commands</p>
            </div>
            <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4 text-center">
              <p className="text-2xl font-mono text-terminal">
                {progress?.files_touched.length || 0}/{mission.requirements.min_files_touched}
              </p>
              <p className="text-xs text-foreground-subtle mt-1">Files Touched</p>
            </div>
            <div className="bg-[hsl(var(--background-surface))] border border-[hsl(var(--border))] rounded-lg p-4 text-center">
              <p className="text-2xl font-mono text-terminal">
                {progress?.evidence_collected.length || 0}/{mission.requirements.min_evidence_items}
              </p>
              <p className="text-xs text-foreground-subtle mt-1">Evidence Items</p>
            </div>
          </div>
        </section>
        
        {/* Environment info */}
        {mission.environment_seed.brickable && (
          <section>
            <div className="bg-amber/10 border border-amber/30 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="text-amber font-display tracking-wider">BRICKABLE ENVIRONMENT</h3>
                <p className="text-foreground-muted text-sm mt-1">
                  This mission can damage the system. Create a snapshot before proceeding.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};
