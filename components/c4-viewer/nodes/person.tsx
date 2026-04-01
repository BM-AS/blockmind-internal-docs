'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { C4NodeData } from '../projection';

function C4PersonNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as C4NodeData;

  return (
    <div
      title={nodeData.element.description}
      className="group relative h-full w-full rounded-[28px] border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
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
      <div className="flex h-full items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-semibold text-zinc-100">
          {nodeData.element.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-50">
            {nodeData.element.name}
          </div>
          {nodeData.element.description ? (
            <div className="line-clamp-2 text-xs text-zinc-400">
              {nodeData.element.description}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const C4PersonNode = memo(C4PersonNodeComponent);
C4PersonNode.displayName = 'C4PersonNode';
