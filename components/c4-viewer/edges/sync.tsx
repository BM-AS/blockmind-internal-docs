'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { memo } from 'react';

function C4SyncEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  style,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: '#a1a1aa',
          strokeWidth: 1.6,
          ...style,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="absolute rounded-full border border-zinc-700 bg-zinc-950/95 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const C4SyncEdge = memo(C4SyncEdgeComponent);
C4SyncEdge.displayName = 'C4SyncEdge';
