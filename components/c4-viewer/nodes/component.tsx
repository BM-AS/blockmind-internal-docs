'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { C4NodeData } from '../projection';

function C4ComponentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as C4NodeData;
  const borderClass = nodeData.isReference
    ? 'border-dashed border-zinc-600'
    : 'border-zinc-700';

  return (
    <div
      title={nodeData.element.description}
      className={`relative h-full w-full rounded-xl border bg-zinc-950/95 ${borderClass} px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.24)]`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Component
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-zinc-50">
        {nodeData.element.name}
      </div>
      {nodeData.element.technology ? (
        <div className="mt-2 inline-flex max-w-full rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
          <span className="truncate">{nodeData.element.technology}</span>
        </div>
      ) : null}
    </div>
  );
}

export const C4ComponentNode = memo(C4ComponentNodeComponent);
C4ComponentNode.displayName = 'C4ComponentNode';
