'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { memo } from 'react';

function C4EventEdgeComponent({
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
          stroke: '#38bdf8',
          strokeWidth: 1.8,
          strokeDasharray: '2 6',
          ...style,
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="absolute rounded-full border border-sky-700/60 bg-zinc-950/95 px-2 py-1 text-[10px] uppercase tracking-wide text-sky-300"
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

export const C4EventEdge = memo(C4EventEdgeComponent);
C4EventEdge.displayName = 'C4EventEdge';
