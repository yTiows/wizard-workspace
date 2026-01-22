import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Mission, 
  MissionProgress, 
  SkillNode, 
  Domain, 
  Difficulty,
  EvidenceItem 
} from '@/types/wizard';
import { useSystemStore } from './systemStore';

// Initial missions based on lessons.txt curriculum
const INITIAL_MISSIONS: Mission[] = [
  {
    mission_id: 'intro_filesystem',
    title: 'Navigate the Unknown',
    difficulty: 'beginner',
    domains: ['linux'],
    briefing: {
      context: 'You\'ve just gained access to a new system. Your first task is to understand its structure.',
      stakes: 'Failure to navigate effectively will leave you blind in hostile territory.',
    },
    objectives: [
      { id: 'obj1', text: 'Find your current location in the filesystem', required: true },
      { id: 'obj2', text: 'List the contents of the home directory', required: true },
      { id: 'obj3', text: 'Navigate to the /data directory', required: true },
      { id: 'obj4', text: 'Read the system log file', required: true },
    ],
    constraints: {
      allowed_apps: ['terminal', 'files', 'notes'],
      restricted_apps: [],
      time_pressure: { enabled: false, seconds: null },
      attempt_policy: { max_attempts: null, penalty: 'none' },
    },
    environment_seed: {
      filesystem_template_id: 'default',
      log_dataset_id: 'basic',
      network_dataset_id: 'none',
      process_dataset_id: 'none',
      ephemeral: false,
      brickable: false,
    },
    requirements: {
      min_terminal_commands: 4,
      min_files_touched: 1,
      min_evidence_items: 1,
    },
    validation: [
      { type: 'regex_stdout', target: 'pwd', pattern_or_value: '/home/user', case_sensitive: true },
      { type: 'regex_stdout', target: 'ls', pattern_or_value: '.', case_sensitive: false },
      { type: 'regex_stdout', target: 'cat', pattern_or_value: 'log', case_sensitive: false },
    ],
    evidence: {
      required_items: [
        { type: 'command_output', label: 'System log contents' },
      ],
    },
    artifacts: [
      { type: 'analysis_note', save_path: '/home/user/artifacts/', template_id: 'filesystem_overview' },
    ],
    rewards: {
      xp: 50,
      unlock_nodes: ['file_permissions'],
      variable_reward: { enabled: false, pool: [] },
    },
    debrief: {
      summary: 'You successfully navigated a Linux filesystem using basic commands.',
      why_it_matters: 'Every operation you perform requires understanding where you are and what\'s around you.',
      real_world_mapping: 'Incident responders and penetration testers must quickly orient themselves in unfamiliar systems.',
    },
  },
  {
    mission_id: 'file_permissions',
    title: 'Permission Denied',
    difficulty: 'beginner',
    domains: ['linux'],
    briefing: {
      context: 'A critical configuration file needs modification, but access controls are blocking you.',
      stakes: 'Understanding permissions is the difference between escalation and a dead end.',
    },
    objectives: [
      { id: 'obj1', text: 'Check file permissions on a system file', required: true },
      { id: 'obj2', text: 'Create a file with restricted permissions', required: true },
      { id: 'obj3', text: 'Understand read/write/execute flags', required: true },
    ],
    constraints: {
      allowed_apps: ['terminal', 'files', 'notes', 'mentor'],
      restricted_apps: [],
      time_pressure: { enabled: false, seconds: null },
      attempt_policy: { max_attempts: null, penalty: 'none' },
    },
    environment_seed: {
      filesystem_template_id: 'default',
      log_dataset_id: 'basic',
      network_dataset_id: 'none',
      process_dataset_id: 'none',
      ephemeral: false,
      brickable: false,
    },
    requirements: {
      min_terminal_commands: 3,
      min_files_touched: 1,
      min_evidence_items: 1,
    },
    validation: [
      { type: 'regex_stdout', target: 'ls -l', pattern_or_value: 'rw', case_sensitive: false },
    ],
    evidence: {
      required_items: [
        { type: 'note', label: 'Permission analysis' },
      ],
    },
    artifacts: [
      { type: 'analysis_note', save_path: '/home/user/artifacts/', template_id: 'permissions_overview' },
    ],
    rewards: {
      xp: 75,
      unlock_nodes: ['process_control'],
      variable_reward: { enabled: true, pool: ['badge'] },
    },
    debrief: {
      summary: 'You learned how Unix permissions control access to files and directories.',
      why_it_matters: 'Misconfigured permissions are one of the most common attack vectors.',
      real_world_mapping: 'Privilege escalation often exploits overly permissive file permissions.',
    },
  },
  {
    mission_id: 'process_investigation',
    title: 'Ghost in the Machine',
    difficulty: 'beginner',
    domains: ['linux', 'logs'],
    briefing: {
      context: 'An unknown process is consuming resources. You need to identify and understand it.',
      stakes: 'Unidentified processes could be malware, cryptominers, or lateral movement tools.',
    },
    objectives: [
      { id: 'obj1', text: 'List running processes', required: true },
      { id: 'obj2', text: 'Identify process resource usage', required: true },
      { id: 'obj3', text: 'Trace process to its origin', required: false },
    ],
    constraints: {
      allowed_apps: ['terminal', 'processes', 'logs', 'notes'],
      restricted_apps: [],
      time_pressure: { enabled: false, seconds: null },
      attempt_policy: { max_attempts: null, penalty: 'none' },
    },
    environment_seed: {
      filesystem_template_id: 'default',
      log_dataset_id: 'process_anomaly',
      network_dataset_id: 'none',
      process_dataset_id: 'suspicious',
      ephemeral: true,
      brickable: false,
    },
    requirements: {
      min_terminal_commands: 3,
      min_files_touched: 1,
      min_evidence_items: 2,
    },
    validation: [
      { type: 'state_flag', target: 'process_identified', pattern_or_value: 'true', case_sensitive: false },
    ],
    evidence: {
      required_items: [
        { type: 'command_output', label: 'Process list' },
        { type: 'note', label: 'Process analysis' },
      ],
    },
    artifacts: [
      { type: 'report', save_path: '/home/user/artifacts/', template_id: 'process_investigation' },
    ],
    rewards: {
      xp: 100,
      unlock_nodes: ['log_analysis'],
      variable_reward: { enabled: true, pool: ['badge', 'wallpaper'] },
    },
    debrief: {
      summary: 'You identified and analyzed an unknown process using system tools.',
      why_it_matters: 'Process investigation is fundamental to incident response and threat hunting.',
      real_world_mapping: 'Every malware investigation begins with process analysis.',
    },
  },
  {
    mission_id: 'log_parsing',
    title: 'Trail of Evidence',
    difficulty: 'beginner',
    domains: ['logs', 'linux'],
    briefing: {
      context: 'System logs contain evidence of a recent intrusion. You need to find the breadcrumbs.',
      stakes: 'Missing the evidence trail means the attacker stays hidden.',
    },
    objectives: [
      { id: 'obj1', text: 'Navigate to log directory', required: true },
      { id: 'obj2', text: 'Search logs for specific patterns', required: true },
      { id: 'obj3', text: 'Extract indicators of compromise', required: true },
      { id: 'obj4', text: 'Document timeline of events', required: false },
    ],
    constraints: {
      allowed_apps: ['terminal', 'logs', 'notes', 'editor'],
      restricted_apps: [],
      time_pressure: { enabled: false, seconds: null },
      attempt_policy: { max_attempts: null, penalty: 'none' },
    },
    environment_seed: {
      filesystem_template_id: 'default',
      log_dataset_id: 'intrusion_evidence',
      network_dataset_id: 'none',
      process_dataset_id: 'none',
      ephemeral: true,
      brickable: false,
    },
    requirements: {
      min_terminal_commands: 5,
      min_files_touched: 2,
      min_evidence_items: 2,
    },
    validation: [
      { type: 'regex_stdout', target: 'grep', pattern_or_value: '.', case_sensitive: false },
      { type: 'file_exists', target: '/home/user/notes/', pattern_or_value: '.md', case_sensitive: false },
    ],
    evidence: {
      required_items: [
        { type: 'ioc_list', label: 'Indicators of compromise' },
        { type: 'timeline', label: 'Event timeline' },
      ],
    },
    artifacts: [
      { type: 'report', save_path: '/home/user/artifacts/', template_id: 'log_analysis' },
    ],
    rewards: {
      xp: 125,
      unlock_nodes: ['network_basics'],
      variable_reward: { enabled: true, pool: ['badge'] },
    },
    debrief: {
      summary: 'You parsed system logs to identify evidence of intrusion.',
      why_it_matters: 'Logs are often the only evidence left behind after an attack.',
      real_world_mapping: 'Log analysis is a core skill for SOC analysts and incident responders.',
    },
  },
  {
    mission_id: 'dangerous_cleanup',
    title: 'Handle with Care',
    difficulty: 'intermediate',
    domains: ['linux'],
    briefing: {
      context: 'You need to clean up sensitive files, but one wrong move could brick the system.',
      stakes: 'This mission allows permanent damage. Choose your commands wisely.',
    },
    objectives: [
      { id: 'obj1', text: 'Create a snapshot before proceeding', required: true },
      { id: 'obj2', text: 'Identify files to remove', required: true },
      { id: 'obj3', text: 'Safely remove only target files', required: true },
      { id: 'obj4', text: 'Verify system integrity', required: true },
    ],
    constraints: {
      allowed_apps: ['terminal', 'files', 'snapshots', 'notes'],
      restricted_apps: [],
      time_pressure: { enabled: false, seconds: null },
      attempt_policy: { max_attempts: 3, penalty: 'state_change' },
    },
    environment_seed: {
      filesystem_template_id: 'default',
      log_dataset_id: 'basic',
      network_dataset_id: 'none',
      process_dataset_id: 'none',
      ephemeral: false,
      brickable: true,
    },
    requirements: {
      min_terminal_commands: 4,
      min_files_touched: 2,
      min_evidence_items: 1,
    },
    validation: [
      { type: 'state_flag', target: 'snapshot_created', pattern_or_value: 'true', case_sensitive: false },
      { type: 'state_flag', target: 'system_intact', pattern_or_value: 'true', case_sensitive: false },
    ],
    evidence: {
      required_items: [
        { type: 'note', label: 'Cleanup procedure' },
      ],
    },
    artifacts: [
      { type: 'script', save_path: '/home/user/artifacts/', template_id: 'cleanup_script' },
    ],
    rewards: {
      xp: 200,
      unlock_nodes: ['advanced_linux'],
      variable_reward: { enabled: true, pool: ['badge', 'tool_skin'] },
    },
    debrief: {
      summary: 'You learned to operate safely in high-stakes environments using snapshots.',
      why_it_matters: 'Production systems have no undo button. Always have a recovery plan.',
      real_world_mapping: 'Incident responders must preserve evidence while containing threats without breaking systems.',
    },
  },
];

// Initial skill graph based on lessons.txt
const INITIAL_SKILL_NODES: SkillNode[] = [
  // Core Linux Path
  {
    id: 'linux_fundamentals',
    title: 'Linux Fundamentals',
    description: 'Basic navigation, file operations, and command line usage',
    type: 'core',
    domain: 'linux',
    difficulty: 'beginner',
    prerequisites: [],
    missions: ['intro_filesystem'],
    xp_required: 0,
    unlocked: true,
    completed: false,
    position: { x: 100, y: 200 },
  },
  {
    id: 'file_permissions',
    title: 'File Permissions',
    description: 'Unix permission model, ownership, and access control',
    type: 'core',
    domain: 'linux',
    difficulty: 'beginner',
    prerequisites: ['linux_fundamentals'],
    missions: ['file_permissions'],
    xp_required: 50,
    unlocked: false,
    completed: false,
    position: { x: 250, y: 200 },
  },
  {
    id: 'process_control',
    title: 'Process Control',
    description: 'Process management, signals, and job control',
    type: 'core',
    domain: 'linux',
    difficulty: 'beginner',
    prerequisites: ['file_permissions'],
    missions: ['process_investigation'],
    xp_required: 125,
    unlocked: false,
    completed: false,
    position: { x: 400, y: 200 },
  },
  {
    id: 'log_analysis',
    title: 'Log Analysis',
    description: 'System log parsing, pattern matching, and timeline construction',
    type: 'branch',
    domain: 'logs',
    difficulty: 'beginner',
    prerequisites: ['process_control'],
    missions: ['log_parsing'],
    xp_required: 225,
    unlocked: false,
    completed: false,
    position: { x: 550, y: 150 },
  },
  {
    id: 'advanced_linux',
    title: 'Advanced Linux',
    description: 'System internals, kernel, and advanced operations',
    type: 'gate',
    domain: 'linux',
    difficulty: 'intermediate',
    prerequisites: ['file_permissions', 'process_control'],
    missions: ['dangerous_cleanup'],
    xp_required: 350,
    unlocked: false,
    completed: false,
    position: { x: 550, y: 250 },
  },
  // Network Path
  {
    id: 'network_basics',
    title: 'Network Fundamentals',
    description: 'TCP/IP, DNS, and network inspection',
    type: 'branch',
    domain: 'network',
    difficulty: 'beginner',
    prerequisites: ['log_analysis'],
    missions: [],
    xp_required: 350,
    unlocked: false,
    completed: false,
    position: { x: 700, y: 100 },
  },
  // Web Security Path  
  {
    id: 'web_basics',
    title: 'Web Fundamentals',
    description: 'HTTP, headers, cookies, and browser security',
    type: 'branch',
    domain: 'web',
    difficulty: 'beginner',
    prerequisites: ['network_basics'],
    missions: [],
    xp_required: 500,
    unlocked: false,
    completed: false,
    position: { x: 850, y: 100 },
  },
  // OPSEC Path
  {
    id: 'opsec_basics',
    title: 'OPSEC Fundamentals',
    description: 'Operational security, identity, and compartmentalization',
    type: 'branch',
    domain: 'opsec',
    difficulty: 'intermediate',
    prerequisites: ['advanced_linux'],
    missions: [],
    xp_required: 500,
    unlocked: false,
    completed: false,
    position: { x: 700, y: 300 },
  },
];

interface MissionStore {
  missions: Mission[];
  skillNodes: SkillNode[];
  activeMission: MissionProgress | null;
  completedMissions: string[];
  
  // Mission actions
  startMission: (missionId: string) => boolean;
  completeMission: () => boolean;
  failMission: () => void;
  abandonMission: () => void;
  
  // Progress tracking
  recordCommand: () => void;
  recordFileTouch: (path: string) => void;
  addEvidence: (item: EvidenceItem) => void;
  completeObjective: (objectiveId: string) => void;
  
  // Skill graph
  unlockNode: (nodeId: string) => void;
  completeNode: (nodeId: string) => void;
  getAvailableMissions: () => Mission[];
  getNodesByDomain: (domain: Domain) => SkillNode[];
  
  // Queries
  getMission: (id: string) => Mission | undefined;
  getNode: (id: string) => SkillNode | undefined;
  canStartMission: (missionId: string) => boolean;
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      missions: INITIAL_MISSIONS,
      skillNodes: INITIAL_SKILL_NODES,
      activeMission: null,
      completedMissions: [],

      startMission: (missionId: string) => {
        const mission = get().missions.find(m => m.mission_id === missionId);
        if (!mission || get().activeMission) return false;

        const progress: MissionProgress = {
          mission_id: missionId,
          started_at: new Date(),
          terminal_commands: 0,
          files_touched: [],
          evidence_collected: [],
          objectives_completed: [],
          attempts: 0,
          failed: false,
          artifacts_generated: [],
        };

        set({ activeMission: progress });
        
        useSystemStore.getState().addNotification(
          'mission',
          'Mission Started',
          mission.title
        );

        return true;
      },

      completeMission: () => {
        const { activeMission, missions } = get();
        if (!activeMission) return false;

        const mission = missions.find(m => m.mission_id === activeMission.mission_id);
        if (!mission) return false;

        // Validate requirements
        const { requirements } = mission;
        if (
          activeMission.terminal_commands < requirements.min_terminal_commands ||
          activeMission.files_touched.length < requirements.min_files_touched ||
          activeMission.evidence_collected.length < requirements.min_evidence_items
        ) {
          useSystemStore.getState().addNotification(
            'warning',
            'Requirements Not Met',
            'Complete all required objectives before finishing.'
          );
          return false;
        }

        // Award XP and update state
        useSystemStore.getState().addXP(mission.rewards.xp);
        useSystemStore.getState().updateStats({
          missions_completed: (useSystemStore.getState().user?.stats.missions_completed || 0) + 1,
        });

        // Unlock reward nodes
        mission.rewards.unlock_nodes.forEach(nodeId => {
          get().unlockNode(nodeId);
        });

        set(state => ({
          activeMission: null,
          completedMissions: [...state.completedMissions, activeMission.mission_id],
        }));

        useSystemStore.getState().addNotification(
          'success',
          'Mission Complete',
          `${mission.title} - +${mission.rewards.xp} XP`
        );

        return true;
      },

      failMission: () => {
        const { activeMission, missions } = get();
        if (!activeMission) return;

        const mission = missions.find(m => m.mission_id === activeMission.mission_id);
        
        set({
          activeMission: {
            ...activeMission,
            failed: true,
            attempts: activeMission.attempts + 1,
          },
        });

        useSystemStore.getState().addNotification(
          'error',
          'Mission Failed',
          mission?.title || 'Unknown mission'
        );
      },

      abandonMission: () => {
        set({ activeMission: null });
      },

      recordCommand: () => {
        set(state => {
          if (!state.activeMission) return state;
          return {
            activeMission: {
              ...state.activeMission,
              terminal_commands: state.activeMission.terminal_commands + 1,
            },
          };
        });
      },

      recordFileTouch: (path: string) => {
        set(state => {
          if (!state.activeMission) return state;
          const touched = state.activeMission.files_touched;
          if (touched.includes(path)) return state;
          return {
            activeMission: {
              ...state.activeMission,
              files_touched: [...touched, path],
            },
          };
        });
      },

      addEvidence: (item: EvidenceItem) => {
        set(state => {
          if (!state.activeMission) return state;
          return {
            activeMission: {
              ...state.activeMission,
              evidence_collected: [...state.activeMission.evidence_collected, item],
            },
          };
        });
      },

      completeObjective: (objectiveId: string) => {
        set(state => {
          if (!state.activeMission) return state;
          if (state.activeMission.objectives_completed.includes(objectiveId)) return state;
          return {
            activeMission: {
              ...state.activeMission,
              objectives_completed: [...state.activeMission.objectives_completed, objectiveId],
            },
          };
        });
      },

      unlockNode: (nodeId: string) => {
        set(state => ({
          skillNodes: state.skillNodes.map(node =>
            node.id === nodeId ? { ...node, unlocked: true } : node
          ),
        }));
      },

      completeNode: (nodeId: string) => {
        set(state => ({
          skillNodes: state.skillNodes.map(node =>
            node.id === nodeId ? { ...node, completed: true } : node
          ),
        }));
      },

      getAvailableMissions: () => {
        const { missions, completedMissions, skillNodes } = get();
        return missions.filter(mission => {
          // Not already completed
          if (completedMissions.includes(mission.mission_id)) return false;
          
          // Check if associated node is unlocked
          const associatedNode = skillNodes.find(n => n.missions.includes(mission.mission_id));
          return !associatedNode || associatedNode.unlocked;
        });
      },

      getNodesByDomain: (domain: Domain) => {
        return get().skillNodes.filter(n => n.domain === domain);
      },

      getMission: (id: string) => {
        return get().missions.find(m => m.mission_id === id);
      },

      getNode: (id: string) => {
        return get().skillNodes.find(n => n.id === id);
      },

      canStartMission: (missionId: string) => {
        const { completedMissions, skillNodes, activeMission } = get();
        
        if (activeMission) return false;
        if (completedMissions.includes(missionId)) return false;
        
        const node = skillNodes.find(n => n.missions.includes(missionId));
        return !node || node.unlocked;
      },
    }),
    {
      name: 'wizard-missions',
      partialize: (state) => ({
        completedMissions: state.completedMissions,
        skillNodes: state.skillNodes,
      }),
    }
  )
);
