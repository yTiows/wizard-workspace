// ============================================
// WIZARD OS - Core Type Definitions
// ============================================

// Filesystem Types
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  parent: string | null;
  permissions: string; // e.g., "rwxr-xr-x"
  owner: string;
  group: string;
  size: number;
  created: Date;
  modified: Date;
  content?: string;
  children?: string[]; // child IDs for directories
  isReadOnly?: boolean;
}

export interface FileSystem {
  nodes: Record<string, FileNode>;
  root: string;
  currentDirectory: string;
}

// Terminal Types
export interface TerminalCommand {
  id: string;
  input: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  workingDirectory: string;
}

export interface TerminalState {
  history: TerminalCommand[];
  commandHistory: string[];
  historyIndex: number;
  currentInput: string;
  workingDirectory: string;
  environment: Record<string, string>;
  aliases: Record<string, string>;
}

// Window System Types
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
}

export type AppId = 
  | 'terminal'
  | 'files'
  | 'editor'
  | 'browser'
  | 'logs'
  | 'network'
  | 'processes'
  | 'packages'
  | 'notes'
  | 'projects'
  | 'portfolio'
  | 'skills'
  | 'mentor'
  | 'snapshots'
  | 'settings'
  | 'missions';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton?: boolean;
}

// Mission Types
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Domain = 
  | 'linux'
  | 'network'
  | 'logs'
  | 'web'
  | 'opsec'
  | 'programming'
  | 'cloud'
  | 'forensics'
  | 'crypto'
  | 'memory';

export interface MissionObjective {
  id: string;
  text: string;
  required: boolean;
  completed?: boolean;
}

export interface MissionConstraint {
  allowed_apps: AppId[];
  restricted_apps: AppId[];
  time_pressure: {
    enabled: boolean;
    seconds: number | null;
  };
  attempt_policy: {
    max_attempts: number | null;
    penalty: 'none' | 'xp' | 'tool_restriction' | 'state_change';
  };
}

export interface ValidationRule {
  type: 'regex_stdout' | 'regex_file' | 'file_exists' | 'file_hash' | 'state_flag' | 'reasoning_text';
  target: string;
  pattern_or_value: string;
  case_sensitive: boolean;
}

export interface EvidenceItem {
  type: 'command_output' | 'note' | 'ioc_list' | 'timeline' | 'screenshot_text';
  label: string;
  content?: string;
  captured?: boolean;
}

export interface MissionArtifact {
  type: 'report' | 'script' | 'detection_rule' | 'analysis_note' | 'config_patch';
  save_path: string;
  template_id: string;
  generated?: boolean;
}

export interface MissionRewards {
  xp: number;
  unlock_nodes: string[];
  variable_reward: {
    enabled: boolean;
    pool: ('badge' | 'tool_skin' | 'wallpaper' | 'extra_node')[];
  };
}

export interface Mission {
  mission_id: string;
  title: string;
  difficulty: Difficulty;
  domains: Domain[];
  briefing: {
    context: string;
    stakes: string;
  };
  objectives: MissionObjective[];
  constraints: MissionConstraint;
  environment_seed: {
    filesystem_template_id: string;
    log_dataset_id: string;
    network_dataset_id: string;
    process_dataset_id: string;
    ephemeral: boolean;
    brickable: boolean;
  };
  requirements: {
    min_terminal_commands: number;
    min_files_touched: number;
    min_evidence_items: number;
  };
  validation: ValidationRule[];
  evidence: {
    required_items: EvidenceItem[];
  };
  artifacts: MissionArtifact[];
  rewards: MissionRewards;
  debrief: {
    summary: string;
    why_it_matters: string;
    real_world_mapping: string;
  };
}

export interface MissionProgress {
  mission_id: string;
  started_at: Date;
  completed_at?: Date;
  terminal_commands: number;
  files_touched: string[];
  evidence_collected: EvidenceItem[];
  objectives_completed: string[];
  attempts: number;
  failed: boolean;
  artifacts_generated: string[];
}

// Skill Graph Types
export type SkillNodeType = 'core' | 'branch' | 'gate' | 'mastery' | 'cross_domain' | 'challenge';

export interface SkillNode {
  id: string;
  title: string;
  description: string;
  type: SkillNodeType;
  domain: Domain;
  difficulty: Difficulty;
  prerequisites: string[];
  missions: string[];
  xp_required: number;
  unlocked: boolean;
  completed: boolean;
  position: { x: number; y: number };
}

// User State Types
export type UserRank = 
  | 'initiate'
  | 'apprentice'
  | 'operator'
  | 'specialist'
  | 'expert'
  | 'master'
  | 'architect';

export interface UserProfile {
  id: string;
  username: string;
  rank: UserRank;
  xp: number;
  level: number;
  created_at: Date;
  last_active: Date;
  preferences: {
    wallpaper: string;
    mentor_mode: 'strict' | 'balanced' | 'helpful';
    terminal_font_size: number;
    show_hints: boolean;
  };
  stats: {
    missions_completed: number;
    total_commands: number;
    files_created: number;
    artifacts_generated: number;
    time_spent_seconds: number;
  };
  badges: string[];
  unlocked_wallpapers: string[];
}

// System State Types
export type MachineState = 'running' | 'paused' | 'bricked' | 'recovering';

export interface Snapshot {
  id: string;
  name: string;
  created_at: Date;
  filesystem_state: string; // serialized
  mission_state?: MissionProgress;
  description?: string;
}

export interface SystemState {
  machine_state: MachineState;
  integrity: number; // 0-100
  network_connected: boolean;
  storage_used: number;
  storage_total: number;
  snapshots: Snapshot[];
  current_mission?: string;
  boot_time: Date;
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mission';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

// Evidence/Notes Types
export interface Note {
  id: string;
  title: string;
  content: string;
  mission_id?: string;
  tags: string[];
  created_at: Date;
  modified_at: Date;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  created_at: Date;
  modified_at: Date;
  mission_origins: string[];
  files: string[];
}

// Boot Sequence Types
export type BootPhase = 
  | 'power_on'
  | 'bios'
  | 'kernel'
  | 'services'
  | 'login'
  | 'desktop';

export interface BootState {
  phase: BootPhase;
  progress: number;
  messages: string[];
  complete: boolean;
}
