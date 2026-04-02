'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { C4FlowNode } from '../projection';

function C4ContainerNodeComponent({
  data,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: NodeProps<C4FlowNode<'c4-container'>>) {
  const nodeData = data;
  const borderClass = nodeData.isReference
    ? 'border-dashed border-zinc-600'
    : 'border-zinc-700';
  const external = nodeData.element.tags?.includes('external');

  return (
    <div
      title={nodeData.element.description}
      className={`relative h-full w-full overflow-hidden rounded-2xl border bg-zinc-900/90 ${borderClass} shadow-[0_12px_32px_rgba(0,0,0,0.22)]`}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        type="source"
        position={sourcePosition}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(39,39,42,0.96),rgba(17,24,39,0.86))]" />
      <div className="relative flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              {external ? 'Reference Container' : 'Container'}
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-50">
              {nodeData.element.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nodeData.element.technology ? (
              <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                {nodeData.element.technology}
              </span>
            ) : null}
            {nodeData.hasChildren ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                {nodeData.isCollapsed ? '+' : '−'}
              </span>
            ) : null}
            {nodeData.drillDownViewId ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                Open
              </span>
            ) : null}
          </div>
        </div>
        {nodeData.element.description ? (
          <p className="max-w-[30ch] text-xs leading-5 text-zinc-400">
            {nodeData.element.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const C4ContainerNode = memo(C4ContainerNodeComponent);
C4ContainerNode.displayName = 'C4ContainerNode';
