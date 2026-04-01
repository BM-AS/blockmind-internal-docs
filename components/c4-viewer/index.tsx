'use client';

import architectureModel from '@/content/data/architecture.json';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { C4AsyncEdge } from './edges/async';
import { C4EventEdge } from './edges/event';
import { C4SyncEdge } from './edges/sync';
import { C4ComponentNode } from './nodes/component';
import { C4ContainerNode } from './nodes/container';
import { C4PersonNode } from './nodes/person';
import { C4SystemNode } from './nodes/system';
import { projectView } from './projection';
import { parseC4Model, type Id, type ViewPerspective } from './schema';
import {
  VIEW_PERSPECTIVES,
  formatPerspectiveLabel,
  getCollapsedDefaults,
} from './utils';

const nodeTypes: NodeTypes = {
  'c4-person': C4PersonNode,
  'c4-system': C4SystemNode,
  'c4-container': C4ContainerNode,
  'c4-component': C4ComponentNode,
};

const edgeTypes: EdgeTypes = {
  'c4-sync': C4SyncEdge,
  'c4-async': C4AsyncEdge,
  'c4-event': C4EventEdge,
};

const model = parseC4Model(architectureModel);

interface C4DiagramProps {
  viewId: Id;
  onViewChange?: (viewId: Id) => void;
}

interface DiagramState {
  viewId: Id;
  collapsedPlacements: Set<Id>;
  activePerspective: ViewPerspective;
}

type DiagramAction =
  | {
      type: 'NAVIGATE';
      viewId: Id;
      perspective: ViewPerspective;
      collapsedDefaults: Set<Id>;
    }
  | { type: 'TOGGLE_COLLAPSE'; placementId: Id }
  | { type: 'SET_PERSPECTIVE'; perspective: ViewPerspective };

function reducer(state: DiagramState, action: DiagramAction): DiagramState {
  switch (action.type) {
    case 'NAVIGATE':
      return {
        viewId: action.viewId,
        collapsedPlacements: action.collapsedDefaults,
        activePerspective: action.perspective,
      };
    case 'TOGGLE_COLLAPSE': {
      const nextCollapsed = new Set(state.collapsedPlacements);
      if (nextCollapsed.has(action.placementId)) {
        nextCollapsed.delete(action.placementId);
      } else {
        nextCollapsed.add(action.placementId);
      }

      return {
        ...state,
        collapsedPlacements: nextCollapsed,
      };
    }
    case 'SET_PERSPECTIVE':
      return {
        ...state,
        activePerspective: action.perspective,
      };
  }
}

export function C4Diagram({ viewId, onViewChange }: C4DiagramProps) {
  const initialView = model.views[viewId];
  const [state, dispatch] = useReducer(reducer, {
    viewId,
    collapsedPlacements: getCollapsedDefaults(initialView),
    activePerspective: initialView.perspective,
  });

  useEffect(() => {
    const nextView = model.views[viewId];
    dispatch({
      type: 'NAVIGATE',
      viewId,
      perspective: nextView.perspective,
      collapsedDefaults: getCollapsedDefaults(nextView),
    });
  }, [viewId]);

  const viewDefinition = model.views[state.viewId];
  const projection = useMemo(
    () =>
      projectView(model, state.viewId, {
        collapsedPlacements: state.collapsedPlacements,
        activePerspective: state.activePerspective,
      }),
    [state.activePerspective, state.collapsedPlacements, state.viewId],
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nextViewId = (node.data as { drillDownViewId?: Id } | undefined)
        ?.drillDownViewId;
      if (!nextViewId || !model.views[nextViewId]) {
        return;
      }

      const nextView = model.views[nextViewId];
      dispatch({
        type: 'NAVIGATE',
        viewId: nextViewId,
        perspective: nextView.perspective,
        collapsedDefaults: getCollapsedDefaults(nextView),
      });
      onViewChange?.(nextViewId);
    },
    [onViewChange],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as
        | {
            element?: { id?: Id };
            hasChildren?: boolean;
          }
        | undefined;

      if (
        !nodeData?.hasChildren ||
        nodeData.element?.id === viewDefinition.rootElementId
      ) {
        return;
      }

      dispatch({
        type: 'TOGGLE_COLLAPSE',
        placementId: node.id,
      });
    },
    [viewDefinition.rootElementId],
  );

  const hasViewport = !!viewDefinition.viewport;

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Interactive C4 View
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-50">
              {viewDefinition.name}
            </div>
          </div>
          <div className="text-xs text-zinc-500">
            Click to collapse. Double-click to drill down.
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-800 px-4 py-2">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          {projection.breadcrumb.map((crumb, index) => (
            <Fragment key={crumb.viewId}>
              {index > 0 ? (
                <span className="text-zinc-700">/</span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const nextView = model.views[crumb.viewId];
                  dispatch({
                    type: 'NAVIGATE',
                    viewId: crumb.viewId,
                    perspective: nextView.perspective,
                    collapsedDefaults: getCollapsedDefaults(nextView),
                  });
                  onViewChange?.(crumb.viewId);
                }}
                className={`transition-colors ${
                  crumb.viewId === state.viewId
                    ? 'font-medium text-zinc-100'
                    : 'hover:text-zinc-200'
                }`}
              >
                {crumb.label}
              </button>
            </Fragment>
          ))}
        </nav>
      </div>

      <div className="border-b border-zinc-800 px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {VIEW_PERSPECTIVES.map((perspective) => (
            <button
              key={perspective}
              type="button"
              onClick={() =>
                dispatch({
                  type: 'SET_PERSPECTIVE',
                  perspective,
                })
              }
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                state.activePerspective === perspective
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {formatPerspectiveLabel(perspective)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[680px] w-full bg-zinc-950">
        <ReactFlowProvider>
          <ReactFlow
            key={state.viewId}
            nodes={projection.nodes}
            edges={projection.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeClick={onNodeClick}
            defaultViewport={hasViewport ? viewDefinition.viewport : undefined}
            fitView={!hasViewport}
            fitViewOptions={{ padding: 0.12 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            minZoom={0.1}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap
              pannable
              zoomable
              className="!border !border-zinc-800 !bg-zinc-900/95"
              nodeColor="#3f3f46"
              maskColor="rgba(9, 9, 11, 0.72)"
            />
            <Controls className="!border-zinc-800 !bg-zinc-900/95 !text-zinc-200" />
            <Background color="#27272a" gap={24} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
