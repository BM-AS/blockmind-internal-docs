'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { memo } from 'react';

function C4AsyncEdgeComponent({
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
          stroke: '#f59e0b',
          strokeWidth: 1.8,
          strokeDasharray: '7 5',
          ...style,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="absolute rounded-full border border-amber-700/60 bg-zinc-950/95 px-2 py-1 text-[10px] uppercase tracking-wide text-amber-300"
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

export const C4AsyncEdge = memo(C4AsyncEdgeComponent);
C4AsyncEdge.displayName = 'C4AsyncEdge';
