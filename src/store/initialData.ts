import { type Edge } from '@xyflow/react';
import { type AppNode } from './types';

export const DEFAULT_DEPTH_COLORS = [
  '#7c3aed', // Level 0 (Root)
  '#a855f7', // Level 1
  '#ec4899', // Level 2
  '#ef4444', // Level 3
  '#f59e0b', // Level 4
  '#10b981', // Level 5
];

export const BRANCH_COLORS = [
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
];

export const initialNodes: AppNode[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'MindMap Explorer', depth: 0 },
    position: { x: 0, y: 0 },
    width: 220,
    height: 80,
  },
  {
    id: 'visuals',
    type: 'mindmap',
    data: { label: 'Visual System', depth: 1, color: 'rgba(139, 92, 246, 0.6)' },
    position: { x: 250, y: -150 },
    width: 180,
    height: 60,
  },
  {
    id: 'glass',
    type: 'mindmap',
    data: { label: 'Glassmorphism', depth: 2 },
    position: { x: 500, y: -200 },
    width: 160,
    height: 60,
  },
  {
    id: 'colors',
    type: 'mindmap',
    data: { label: 'Dynamic Colors', depth: 2 },
    position: { x: 500, y: -100 },
    width: 160,
    height: 60,
  },
  {
    id: 'depth-colors',
    type: 'mindmap',
    data: { label: 'Depth Palettes', depth: 3 },
    position: { x: 750, y: -100 },
    width: 140,
    height: 50,
  },
  {
    id: 'features',
    type: 'mindmap',
    data: { label: 'Core Features', depth: 1, color: 'rgba(16, 185, 129, 0.6)' },
    position: { x: 250, y: 50 },
    width: 180,
    height: 60,
  },
  {
    id: 'layout',
    type: 'mindmap',
    data: { label: 'Auto Layout', depth: 2 },
    position: { x: 500, y: 0 },
    width: 160,
    height: 60,
  },
  {
    id: 'dagre',
    type: 'mindmap',
    data: { label: 'Dagre Engine', depth: 3 },
    position: { x: 750, y: -25 },
    width: 140,
    height: 50,
  },
  {
    id: 'persistence',
    type: 'mindmap',
    data: { label: 'Data Persistence', depth: 2 },
    position: { x: 500, y: 100 },
    width: 160,
    height: 60,
  },
  {
    id: 'indexeddb',
    type: 'mindmap',
    data: { label: 'IndexedDB', depth: 3 },
    position: { x: 750, y: 100 },
    width: 140,
    height: 50,
  },
  {
    id: 'roadmap',
    type: 'mindmap',
    data: { label: 'Future Roadmap', depth: 1, color: 'rgba(120, 80, 5, 0.6)' },
    position: { x: 250, y: 200 },
    width: 180,
    height: 60,
  },
  {
    id: 'ai-brain',
    type: 'mindmap',
    data: { label: 'AI Intelligence', depth: 2 },
    position: { x: 500, y: 175 },
    width: 160,
    height: 60,
  },
  {
    id: 'collab',
    type: 'mindmap',
    data: { label: 'Real-time Collab', depth: 2 },
    position: { x: 500, y: 225 },
    width: 160,
    height: 60,
  },
];

export const initialEdges: Edge[] = [
  { id: 'e-root-v', source: 'root', target: 'visuals', type: 'custom', label: 'aesthetic' },
  { id: 'e-root-f', source: 'root', target: 'features', type: 'custom', label: 'logic' },
  { id: 'e-root-r', source: 'root', target: 'roadmap', type: 'custom', label: 'future' },
  { id: 'e-v-g', source: 'visuals', target: 'glass', type: 'custom' },
  { id: 'e-v-c', source: 'visuals', target: 'colors', type: 'custom' },
  { id: 'e-c-d', source: 'colors', target: 'depth-colors', type: 'custom', label: 'auto' },
  { id: 'e-f-l', source: 'features', target: 'layout', type: 'custom' },
  { id: 'e-l-d', source: 'layout', target: 'dagre', type: 'custom', label: 'fast' },
  { id: 'e-f-p', source: 'features', target: 'persistence', type: 'custom' },
  { id: 'e-p-i', source: 'persistence', target: 'indexeddb', type: 'custom' },
  { id: 'e-r-a', source: 'roadmap', target: 'ai-brain', type: 'custom' },
  { id: 'e-r-c', source: 'roadmap', target: 'collab', type: 'custom' },
];
