import { MarkerType, Position, type Edge, type Node } from '@xyflow/react';
import type {
  C4Element,
  C4Model,
  C4Relationship,
  Id,
  PlacementDef,
  ViewPerspective,
} from './schema';
import {
  buildBreadcrumb,
  getPlacementChildren,
  getPreferredViewId,
  hasOwnedChildren,
} from './utils';

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
  nodes: Array<Node<C4NodeData>>;
  edges: Array<Edge<C4EdgeData>>;
  breadcrumb: Array<{ elementId: Id; viewId: Id; label: string }>;
}

export interface ProjectionState {
  collapsedPlacements: Set<Id>;
  activePerspective: ViewPerspective;
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
  const nodes: Array<Node<C4NodeData>> = [];

  for (const placement of view.placements) {
    if (hiddenPlacements.has(placement.placementId)) {
      continue;
    }

    const element = model.elements[placement.elementId];
    if (!element) {
      continue;
    }

    visiblePlacementIds.add(placement.placementId);

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

    const ownedChildren = hasOwnedChildren(model, placement.elementId);
    const drillDownViewId = ownedChildren
      ? getPreferredViewId(model, placement.elementId, view.id)
      : undefined;
    const isCollapsed =
      placement.collapsed || state.collapsedPlacements.has(placement.placementId);

    nodes.push({
      id: placement.placementId,
      type: `c4-${element.kind}`,
      position: placement.position,
      parentId: placement.parentPlacementId,
      extent: placement.parentPlacementId ? 'parent' : undefined,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        element,
        isReference,
        isCollapsed,
        drillDownViewId,
        hasChildren: ownedChildren,
      },
      style: placement.size
        ? {
            width: placement.size.width,
            height: placement.size.height,
          }
        : undefined,
    });
  }

  const excludedRelationships = new Set(view.excludeRelationships ?? []);
  const edges: Array<Edge<C4EdgeData>> = [];

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

  return {
    nodes,
    edges,
    breadcrumb: buildBreadcrumb(model, viewId),
  };
}
