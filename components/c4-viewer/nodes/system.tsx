'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { C4FlowNode } from '../projection';

function C4SystemNodeComponent({
  data,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
}: NodeProps<C4FlowNode<'c4-system'>>) {
  const nodeData = data;
  const borderClass = nodeData.isReference
    ? 'border-dashed border-zinc-600'
    : 'border-zinc-700';
  const external = nodeData.element.tags?.includes('external');

  return (
    <div
      title={nodeData.element.description}
      className={`relative h-full w-full overflow-hidden rounded-2xl border bg-zinc-900/95 ${borderClass} shadow-[0_16px_40px_rgba(0,0,0,0.28)]`}
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(161,161,170,0.12),transparent_45%)]" />
      <div className="relative flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              {external ? 'External System' : 'Software System'}
            </div>
            <div className="mt-1 text-base font-semibold text-zinc-50">
              {nodeData.element.name}
            </div>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            {nodeData.hasChildren ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {nodeData.isCollapsed ? '+' : '−'}
              </span>
            ) : null}
            {nodeData.drillDownViewId ? (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Open
              </span>
            ) : null}
          </div>
        </div>
        {nodeData.element.description ? (
          <p className="max-w-[32ch] text-sm leading-5 text-zinc-400">
            {nodeData.element.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const C4SystemNode = memo(C4SystemNodeComponent);
C4SystemNode.displayName = 'C4SystemNode';
