import { MarkerType, Position, type Edge, type Node } from '@xyflow/react';
import type {
  C4Element,
  C4Model,
  Id,
  PlacementDef,
  ViewPerspective,
} from './schema';
import {
  buildBreadcrumb,
  getDeeperViewId,
  getPlacementChildren,
} from './utils';

export type C4NodeType =
  | 'c4-person'
  | 'c4-system'
  | 'c4-container'
  | 'c4-component';

export interface C4NodeData extends Record<string, unknown> {
  element: C4Element;
  isReference: boolean;
  isCollapsed: boolean;
  drillDownViewId?: Id;
  hasChildren: boolean;
}

export interface C4EdgeData extends Record<string, unknown> {
  technology?: string;
  relationshipId: Id;
}

export interface ProjectionResult {
  nodes: Array<C4FlowNode>;
  edges: Array<Edge<C4EdgeData>>;
  breadcrumb: Array<{ viewId: Id; label: string }>;
}

export interface ProjectionState {
  collapsedPlacements: Set<Id>;
  activePerspective: ViewPerspective;
  path: Id[];
}

export type C4FlowNode<T extends C4NodeType = C4NodeType> = Node<C4NodeData, T>;

function getHandlePosition(
  dx: number,
  dy: number,
  role: 'source' | 'target',
): Position {
  const vertical = Math.abs(dy) > Math.abs(dx);

  if (vertical) {
    if (role === 'source') {
      return dy >= 0 ? Position.Bottom : Position.Top;
    }

    return dy >= 0 ? Position.Top : Position.Bottom;
  }

  if (role === 'source') {
    return dx >= 0 ? Position.Right : Position.Left;
  }

  return dx >= 0 ? Position.Left : Position.Right;
}

export function projectView(
  model: C4Model,
  viewId: Id,
  state: ProjectionState,
): ProjectionResult {
  const view = model.views[viewId];
  const placementByElement = new Map<Id, PlacementDef>();
  const placementById = new Map<Id, PlacementDef>();

  for (const placement of view.placements) {
    placementByElement.set(placement.elementId, placement);
    placementById.set(placement.placementId, placement);
  }

  const childrenOf = getPlacementChildren(view.placements);
  const hiddenPlacements = new Set<Id>();
  const absolutePositionByPlacementId = new Map<Id, { x: number; y: number }>();

  const getAbsolutePosition = (placementId: Id): { x: number; y: number } => {
    const cachedPosition = absolutePositionByPlacementId.get(placementId);
    if (cachedPosition) {
      return cachedPosition;
    }

    const placement = placementById.get(placementId);
    if (!placement) {
      return { x: 0, y: 0 };
    }

    const parentPosition = placement.parentPlacementId
      ? getAbsolutePosition(placement.parentPlacementId)
      : { x: 0, y: 0 };
    const absolutePosition = {
      x: parentPosition.x + placement.position.x,
      y: parentPosition.y + placement.position.y,
    };

    absolutePositionByPlacementId.set(placementId, absolutePosition);

    return absolutePosition;
  };

  const hideDescendants = (placementId: Id) => {
    for (const child of childrenOf.get(placementId) ?? []) {
      hiddenPlacements.add(child.placementId);
      hideDescendants(child.placementId);
    }
  };

  for (const placement of view.placements) {
    if (
      placement.collapsed ||
      state.collapsedPlacements.has(placement.placementId)
    ) {
      hideDescendants(placement.placementId);
    }
  }

  const containmentByChild = new Map<Id, typeof model.containment>();
  for (const containment of model.containment) {
    const list = containmentByChild.get(containment.childId) ?? [];
    list.push(containment);
    containmentByChild.set(containment.childId, list);
  }

  const visiblePlacementIds = new Set<Id>();
  const visiblePlacements: PlacementDef[] = [];
  const detailDepthByPlacementId = new Map<Id, number>();

  const getDetailDepth = (placementId: Id): number => {
    const cachedDepth = detailDepthByPlacementId.get(placementId);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const childPlacements = childrenOf.get(placementId) ?? [];
    const depth =
      childPlacements.length === 0
        ? 0
        : 1 +
          Math.max(
            ...childPlacements.map((child) => getDetailDepth(child.placementId)),
          );

    detailDepthByPlacementId.set(placementId, depth);

    return depth;
  };

  for (const placement of view.placements) {
    if (hiddenPlacements.has(placement.placementId)) {
      continue;
    }

    const element = model.elements[placement.elementId];
    if (!element) {
      continue;
    }

    visiblePlacementIds.add(placement.placementId);
    visiblePlacements.push(placement);
  }

  const excludedRelationships = new Set(view.excludeRelationships ?? []);
  const edges: Array<Edge<C4EdgeData>> = [];
  const edgeVectorsByPlacementId = new Map<
    Id,
    { sourceDx: number; sourceDy: number; targetDx: number; targetDy: number }
  >();

  const getEdgeVector = (placementId: Id) =>
    edgeVectorsByPlacementId.get(placementId) ?? {
      sourceDx: 0,
      sourceDy: 0,
      targetDx: 0,
      targetDy: 0,
    };

  for (const relationship of Object.values(model.relationships)) {
    if (excludedRelationships.has(relationship.id)) {
      continue;
    }

    const sourcePlacement = placementByElement.get(relationship.sourceId);
    const targetPlacement = placementByElement.get(relationship.targetId);
    if (!sourcePlacement || !targetPlacement) {
      continue;
    }

    if (
      !visiblePlacementIds.has(sourcePlacement.placementId) ||
      !visiblePlacementIds.has(targetPlacement.placementId)
    ) {
      continue;
    }

    const matchesPerspective =
      !relationship.perspectives?.length ||
      relationship.perspectives.includes(state.activePerspective as never);
    const sourcePosition = getAbsolutePosition(sourcePlacement.placementId);
    const targetPosition = getAbsolutePosition(targetPlacement.placementId);
    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const sourceVector = getEdgeVector(sourcePlacement.placementId);
    const targetVector = getEdgeVector(targetPlacement.placementId);

    edgeVectorsByPlacementId.set(sourcePlacement.placementId, {
      ...sourceVector,
      sourceDx: sourceVector.sourceDx + dx,
      sourceDy: sourceVector.sourceDy + dy,
    });
    edgeVectorsByPlacementId.set(targetPlacement.placementId, {
      ...targetVector,
      targetDx: targetVector.targetDx + dx,
      targetDy: targetVector.targetDy + dy,
    });

    edges.push({
      id: `edge-${relationship.id}`,
      source: sourcePlacement.placementId,
      target: targetPlacement.placementId,
      type:
        relationship.style === 'async'
          ? 'c4-async'
          : relationship.style === 'event'
            ? 'c4-event'
            : 'c4-sync',
      label: relationship.label,
      animated:
        relationship.style === 'async' || relationship.style === 'event',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      data: {
        technology: relationship.technology,
        relationshipId: relationship.id,
      },
      style: matchesPerspective
        ? undefined
        : {
            opacity: 0.24,
            strokeDasharray: '6 6',
          },
    });
  }

  const nodes: Array<C4FlowNode> = [];

  for (const placement of visiblePlacements) {
    const element = model.elements[placement.elementId];
    if (!element) {
      continue;
    }

    const parentElementId = placement.parentPlacementId
      ? placementById.get(placement.parentPlacementId)?.elementId
      : view.rootElementId;
    const containments = containmentByChild.get(placement.elementId) ?? [];
    const isReference =
      !!parentElementId &&
      containments.some(
        (containment) =>
          containment.parentId === parentElementId &&
          containment.mode === 'references',
      );
    const childPlacements = childrenOf.get(placement.placementId) ?? [];
    const currentDetailDepth = getDetailDepth(placement.placementId);
    const drillDownViewId = getDeeperViewId(
      model,
      placement.elementId,
      view.id,
      currentDetailDepth,
    );
    const isCollapsed =
      placement.collapsed || state.collapsedPlacements.has(placement.placementId);
    const edgeVector = getEdgeVector(placement.placementId);

    nodes.push({
      id: placement.placementId,
      type: `c4-${element.kind}` as C4NodeType,
      position: placement.position,
      parentId: placement.parentPlacementId,
      extent: placement.parentPlacementId ? 'parent' : undefined,
      sourcePosition: getHandlePosition(
        edgeVector.sourceDx,
        edgeVector.sourceDy,
        'source',
      ),
      targetPosition: getHandlePosition(
        edgeVector.targetDx,
        edgeVector.targetDy,
        'target',
      ),
      data: {
        element,
        isReference,
        isCollapsed,
        drillDownViewId,
        hasChildren: childPlacements.length > 0,
      },
      style: placement.size
        ? {
            width: placement.size.width,
            height: placement.size.height,
          }
        : undefined,
    });
  }

  return {
    nodes,
    edges,
    breadcrumb: buildBreadcrumb(model, state.path),
  };
}
