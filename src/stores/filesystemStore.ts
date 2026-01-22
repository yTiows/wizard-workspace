import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { FileNode, FileSystem } from '@/types/wizard';

// Initial filesystem structure
const createInitialFilesystem = (): FileSystem => {
  const now = new Date();
  const nodes: Record<string, FileNode> = {};

  // Helper to create a node
  const createNode = (
    name: string,
    type: 'file' | 'directory',
    parentPath: string,
    parentId: string | null,
    content?: string,
    isReadOnly?: boolean
  ): FileNode => {
    const id = uuidv4();
    const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    return {
      id,
      name,
      type,
      path,
      parent: parentId,
      permissions: type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--',
      owner: 'user',
      group: 'user',
      size: content ? content.length : 0,
      created: now,
      modified: now,
      content,
      children: type === 'directory' ? [] : undefined,
      isReadOnly,
    };
  };

  // Root
  const root = createNode('', 'directory', '', null);
  root.path = '/';
  root.permissions = 'rwxr-xr-x';
  nodes[root.id] = root;

  // System directories
  const system = createNode('system', 'directory', '/', root.id, undefined, true);
  nodes[system.id] = system;
  root.children!.push(system.id);

  const home = createNode('home', 'directory', '/', root.id);
  nodes[home.id] = home;
  root.children!.push(home.id);

  const user = createNode('user', 'directory', '/home', home.id);
  nodes[user.id] = user;
  home.children!.push(user.id);

  // User directories
  const workspace = createNode('workspace', 'directory', '/home/user', user.id);
  nodes[workspace.id] = workspace;
  user.children!.push(workspace.id);

  const projects = createNode('projects', 'directory', '/home/user', user.id);
  nodes[projects.id] = projects;
  user.children!.push(projects.id);

  const artifacts = createNode('artifacts', 'directory', '/home/user', user.id);
  nodes[artifacts.id] = artifacts;
  user.children!.push(artifacts.id);

  const notes = createNode('notes', 'directory', '/home/user', user.id);
  nodes[notes.id] = notes;
  user.children!.push(notes.id);

  const downloads = createNode('downloads', 'directory', '/home/user', user.id);
  nodes[downloads.id] = downloads;
  user.children!.push(downloads.id);

  // Missions
  const missions = createNode('missions', 'directory', '/', root.id);
  nodes[missions.id] = missions;
  root.children!.push(missions.id);

  const active = createNode('active', 'directory', '/missions', missions.id);
  nodes[active.id] = active;
  missions.children!.push(active.id);

  // Data
  const data = createNode('data', 'directory', '/', root.id);
  nodes[data.id] = data;
  root.children!.push(data.id);

  const logs = createNode('logs', 'directory', '/data', data.id);
  nodes[logs.id] = logs;
  data.children!.push(logs.id);

  const network = createNode('network', 'directory', '/data', data.id);
  nodes[network.id] = network;
  data.children!.push(network.id);

  const processes = createNode('processes', 'directory', '/data', data.id);
  nodes[processes.id] = processes;
  data.children!.push(processes.id);

  // Snapshots
  const snapshots = createNode('snapshots', 'directory', '/', root.id);
  nodes[snapshots.id] = snapshots;
  root.children!.push(snapshots.id);

  // Add some initial files
  const readme = createNode('README.md', 'file', '/home/user', user.id, `# WIZARD OS
  
Welcome to your controlled environment.

## Quick Start
- Use the terminal to navigate and execute commands
- Complete missions to unlock new skills
- Your work is saved automatically

## Directory Structure
- ~/workspace - Your working directory
- ~/projects - Saved projects
- ~/artifacts - Mission artifacts
- ~/notes - Your notes and evidence
- ~/downloads - Export staging

Type 'help' in terminal for available commands.
`);
  nodes[readme.id] = readme;
  user.children!.push(readme.id);

  const bashrc = createNode('.bashrc', 'file', '/home/user', user.id, `# ~/.bashrc
export PS1='\\u@wizard:\\w\\$ '
export PATH=$PATH:/usr/local/bin
alias ll='ls -la'
alias cls='clear'
`);
  nodes[bashrc.id] = bashrc;
  user.children!.push(bashrc.id);

  // System log
  const syslog = createNode('system.log', 'file', '/data/logs', logs.id, `[${now.toISOString()}] WIZARD OS initialized
[${now.toISOString()}] Filesystem mounted
[${now.toISOString()}] User session started
[${now.toISOString()}] All systems nominal
`);
  nodes[syslog.id] = syslog;
  logs.children!.push(syslog.id);

  return {
    nodes,
    root: root.id,
    currentDirectory: user.id,
  };
};

interface FilesystemStore {
  filesystem: FileSystem;
  
  // Navigation
  getCurrentDirectory: () => FileNode | null;
  getNodeById: (id: string) => FileNode | null;
  getNodeByPath: (path: string) => FileNode | null;
  getChildren: (nodeId: string) => FileNode[];
  setCurrentDirectory: (path: string) => boolean;
  
  // File operations
  createFile: (name: string, parentPath: string, content?: string) => FileNode | null;
  createDirectory: (name: string, parentPath: string) => FileNode | null;
  deleteNode: (path: string) => boolean;
  renameNode: (path: string, newName: string) => boolean;
  moveNode: (sourcePath: string, destPath: string) => boolean;
  updateFileContent: (path: string, content: string) => boolean;
  readFile: (path: string) => string | null;
  
  // Path utilities
  resolvePath: (path: string) => string;
  getParentPath: (path: string) => string;
  
  // State management
  resetFilesystem: () => void;
  exportFilesystem: () => string;
  importFilesystem: (data: string) => boolean;
}

export const useFilesystemStore = create<FilesystemStore>()(
  persist(
    (set, get) => ({
      filesystem: createInitialFilesystem(),

      getCurrentDirectory: () => {
        const { filesystem } = get();
        return filesystem.nodes[filesystem.currentDirectory] || null;
      },

      getNodeById: (id: string) => {
        const { filesystem } = get();
        return filesystem.nodes[id] || null;
      },

      getNodeByPath: (path: string) => {
        const { filesystem } = get();
        const resolvedPath = get().resolvePath(path);
        return Object.values(filesystem.nodes).find(n => n.path === resolvedPath) || null;
      },

      getChildren: (nodeId: string) => {
        const { filesystem } = get();
        const node = filesystem.nodes[nodeId];
        if (!node || node.type !== 'directory' || !node.children) return [];
        return node.children.map(id => filesystem.nodes[id]).filter(Boolean);
      },

      setCurrentDirectory: (path: string) => {
        const resolvedPath = get().resolvePath(path);
        const node = get().getNodeByPath(resolvedPath);
        if (!node || node.type !== 'directory') return false;
        
        set(state => ({
          filesystem: {
            ...state.filesystem,
            currentDirectory: node.id,
          },
        }));
        return true;
      },

      createFile: (name: string, parentPath: string, content = '') => {
        const parent = get().getNodeByPath(parentPath);
        if (!parent || parent.type !== 'directory') return null;

        const newPath = parent.path === '/' ? `/${name}` : `${parent.path}/${name}`;
        
        // Check if already exists
        if (get().getNodeByPath(newPath)) return null;

        const now = new Date();
        const newFile: FileNode = {
          id: uuidv4(),
          name,
          type: 'file',
          path: newPath,
          parent: parent.id,
          permissions: 'rw-r--r--',
          owner: 'user',
          group: 'user',
          size: content.length,
          created: now,
          modified: now,
          content,
        };

        set(state => ({
          filesystem: {
            ...state.filesystem,
            nodes: {
              ...state.filesystem.nodes,
              [newFile.id]: newFile,
              [parent.id]: {
                ...parent,
                children: [...(parent.children || []), newFile.id],
              },
            },
          },
        }));

        return newFile;
      },

      createDirectory: (name: string, parentPath: string) => {
        const parent = get().getNodeByPath(parentPath);
        if (!parent || parent.type !== 'directory') return null;

        const newPath = parent.path === '/' ? `/${name}` : `${parent.path}/${name}`;
        
        if (get().getNodeByPath(newPath)) return null;

        const now = new Date();
        const newDir: FileNode = {
          id: uuidv4(),
          name,
          type: 'directory',
          path: newPath,
          parent: parent.id,
          permissions: 'rwxr-xr-x',
          owner: 'user',
          group: 'user',
          size: 0,
          created: now,
          modified: now,
          children: [],
        };

        set(state => ({
          filesystem: {
            ...state.filesystem,
            nodes: {
              ...state.filesystem.nodes,
              [newDir.id]: newDir,
              [parent.id]: {
                ...parent,
                children: [...(parent.children || []), newDir.id],
              },
            },
          },
        }));

        return newDir;
      },

      deleteNode: (path: string) => {
        const node = get().getNodeByPath(path);
        if (!node || node.isReadOnly || !node.parent) return false;

        const parent = get().getNodeById(node.parent);
        if (!parent) return false;

        // Recursively collect all descendant IDs to delete
        const collectDescendants = (nodeId: string): string[] => {
          const n = get().getNodeById(nodeId);
          if (!n) return [nodeId];
          if (n.type === 'directory' && n.children) {
            return [nodeId, ...n.children.flatMap(collectDescendants)];
          }
          return [nodeId];
        };

        const toDelete = collectDescendants(node.id);

        set(state => {
          const newNodes = { ...state.filesystem.nodes };
          toDelete.forEach(id => delete newNodes[id]);
          
          if (parent.children) {
            newNodes[parent.id] = {
              ...parent,
              children: parent.children.filter(id => id !== node.id),
            };
          }

          return {
            filesystem: {
              ...state.filesystem,
              nodes: newNodes,
            },
          };
        });

        return true;
      },

      renameNode: (path: string, newName: string) => {
        const node = get().getNodeByPath(path);
        if (!node || node.isReadOnly) return false;

        const parentPath = get().getParentPath(path);
        const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

        if (get().getNodeByPath(newPath)) return false;

        // Update path of all descendants
        const updatePaths = (nodeId: string, oldBasePath: string, newBasePath: string) => {
          const n = get().getNodeById(nodeId);
          if (!n) return;

          const updatedPath = n.path.replace(oldBasePath, newBasePath);
          
          set(state => ({
            filesystem: {
              ...state.filesystem,
              nodes: {
                ...state.filesystem.nodes,
                [nodeId]: {
                  ...n,
                  path: updatedPath,
                  name: nodeId === node.id ? newName : n.name,
                  modified: new Date(),
                },
              },
            },
          }));

          if (n.type === 'directory' && n.children) {
            n.children.forEach(childId => updatePaths(childId, oldBasePath, newBasePath));
          }
        };

        updatePaths(node.id, node.path, newPath);
        return true;
      },

      moveNode: (sourcePath: string, destPath: string) => {
        const node = get().getNodeByPath(sourcePath);
        const destParent = get().getNodeByPath(destPath);
        
        if (!node || !destParent || destParent.type !== 'directory' || node.isReadOnly) {
          return false;
        }

        const oldParent = node.parent ? get().getNodeById(node.parent) : null;
        if (!oldParent) return false;

        const newPath = destPath === '/' ? `/${node.name}` : `${destPath}/${node.name}`;
        
        if (get().getNodeByPath(newPath)) return false;

        set(state => ({
          filesystem: {
            ...state.filesystem,
            nodes: {
              ...state.filesystem.nodes,
              [node.id]: {
                ...node,
                path: newPath,
                parent: destParent.id,
                modified: new Date(),
              },
              [oldParent.id]: {
                ...oldParent,
                children: oldParent.children?.filter(id => id !== node.id),
              },
              [destParent.id]: {
                ...destParent,
                children: [...(destParent.children || []), node.id],
              },
            },
          },
        }));

        return true;
      },

      updateFileContent: (path: string, content: string) => {
        const node = get().getNodeByPath(path);
        if (!node || node.type !== 'file' || node.isReadOnly) return false;

        set(state => ({
          filesystem: {
            ...state.filesystem,
            nodes: {
              ...state.filesystem.nodes,
              [node.id]: {
                ...node,
                content,
                size: content.length,
                modified: new Date(),
              },
            },
          },
        }));

        return true;
      },

      readFile: (path: string) => {
        const node = get().getNodeByPath(path);
        if (!node || node.type !== 'file') return null;
        return node.content || '';
      },

      resolvePath: (path: string) => {
        const { filesystem } = get();
        const currentDir = filesystem.nodes[filesystem.currentDirectory];
        
        if (!path || path === '.') {
          return currentDir?.path || '/';
        }

        if (path === '~') {
          return '/home/user';
        }

        if (path.startsWith('~/')) {
          return '/home/user' + path.slice(1);
        }

        if (path.startsWith('/')) {
          // Absolute path - normalize it
          const parts = path.split('/').filter(Boolean);
          const resolved: string[] = [];
          
          for (const part of parts) {
            if (part === '..') {
              resolved.pop();
            } else if (part !== '.') {
              resolved.push(part);
            }
          }
          
          return '/' + resolved.join('/') || '/';
        }

        // Relative path
        const currentPath = currentDir?.path || '/';
        const parts = (currentPath + '/' + path).split('/').filter(Boolean);
        const resolved: string[] = [];
        
        for (const part of parts) {
          if (part === '..') {
            resolved.pop();
          } else if (part !== '.') {
            resolved.push(part);
          }
        }
        
        return '/' + resolved.join('/') || '/';
      },

      getParentPath: (path: string) => {
        const parts = path.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/') || '/';
      },

      resetFilesystem: () => {
        set({ filesystem: createInitialFilesystem() });
      },

      exportFilesystem: () => {
        return JSON.stringify(get().filesystem);
      },

      importFilesystem: (data: string) => {
        try {
          const fs = JSON.parse(data);
          set({ filesystem: fs });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'wizard-filesystem',
    }
  )
);
