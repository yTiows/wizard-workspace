import { motion } from 'framer-motion';
import { useSystemStore } from '@/stores/systemStore';
import { useMissionStore } from '@/stores/missionStore';

export const StatusBar = () => {
  const { user, systemState, notifications } = useSystemStore();
  const { activeMission } = useMissionStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const getMachineStateColor = () => {
    switch (systemState.machine_state) {
      case 'running': return 'status-dot-active';
      case 'paused': return 'status-dot-warning';
      case 'bricked': return 'status-dot-error';
      case 'recovering': return 'status-dot-warning';
      default: return 'status-dot-offline';
    }
  };

  const getIntegrityColor = () => {
    if (systemState.integrity > 75) return 'text-terminal';
    if (systemState.integrity > 50) return 'text-amber';
    if (systemState.integrity > 25) return 'text-amber-glow';
    return 'text-danger';
  };

  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      className="h-8 bg-[hsl(var(--status-bg))] border-b border-border flex items-center justify-between px-4 text-xs select-none"
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* System Logo */}
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-terminal text-[10px] tracking-wider">WIZARD</span>
          <span className="text-foreground-subtle">|</span>
        </div>

        {/* Machine State */}
        <div className="flex items-center gap-2">
          <div className={`status-dot ${getMachineStateColor()}`} />
          <span className="text-foreground-muted uppercase tracking-wide">
            {systemState.machine_state}
          </span>
        </div>

        {/* Integrity */}
        <div className="flex items-center gap-2">
          <span className="text-foreground-subtle">INT:</span>
          <span className={getIntegrityColor()}>
            {systemState.integrity}%
          </span>
        </div>

        {/* Network */}
        <div className="flex items-center gap-2">
          <div className={`status-dot ${systemState.network_connected ? 'status-dot-active' : 'status-dot-offline'}`} />
          <span className="text-foreground-muted">
            {systemState.network_connected ? 'NET' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Center - Active Mission */}
      {activeMission && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-terminal-dim/30 rounded border border-terminal-dim">
          <span className="text-terminal text-[10px] uppercase tracking-wider">Active Mission</span>
          <span className="text-foreground-muted">|</span>
          <span className="text-terminal-glow">
            {useMissionStore.getState().getMission(activeMission.mission_id)?.title}
          </span>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* User rank */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-foreground-subtle">RANK:</span>
            <span className="text-cyber uppercase">{user.rank}</span>
          </div>
        )}

        {/* XP */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-foreground-subtle">XP:</span>
            <span className="text-terminal">{user.xp}</span>
          </div>
        )}

        {/* Snapshots available */}
        <div className="flex items-center gap-1">
          <span className="text-foreground-subtle">⊡</span>
          <span className="text-foreground-muted">{systemState.snapshots.length}</span>
        </div>

        {/* Notifications */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 text-amber">
            <span>⚠</span>
            <span>{unreadCount}</span>
          </div>
        )}

        {/* Time */}
        <div className="text-foreground-muted font-mono">
          {time}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <span className="text-foreground-muted">{user.username}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
