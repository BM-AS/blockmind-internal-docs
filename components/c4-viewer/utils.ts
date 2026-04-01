import type {
  C4Model,
  Id,
  PlacementDef,
  ViewDefinition,
  ViewPerspective,
} from './schema';

export const VIEW_PERSPECTIVES: ViewPerspective[] = [
  'structure',
  'dataFlow',
  'security',
  'deployment',
];

export function formatPerspectiveLabel(perspective: ViewPerspective): string {
  switch (perspective) {
    case 'dataFlow':
      return 'Data Flow';
    default:
      return perspective.charAt(0).toUpperCase() + perspective.slice(1);
  }
}

export function getCollapsedDefaults(view: ViewDefinition): Set<Id> {
  return new Set(
    view.placements
      .filter((placement) => placement.collapsed)
      .map((placement) => placement.placementId),
  );
}

export function getViewDetailDepth(view: ViewDefinition): number {
  const childrenOf = getPlacementChildren(view.placements);
  const depthByPlacementId = new Map<Id, number>();

  const getDepth = (placementId: Id): number => {
    const cachedDepth = depthByPlacementId.get(placementId);
    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    const childPlacements = childrenOf.get(placementId) ?? [];
    const depth =
      childPlacements.length === 0
        ? 0
        : 1 +
          Math.max(
            ...childPlacements.map((child) => getDepth(child.placementId)),
          );

    depthByPlacementId.set(placementId, depth);

    return depth;
  };

  return Math.max(...view.placements.map((placement) => getDepth(placement.placementId)));
}

export function getDeeperViewId(
  model: C4Model,
  elementId: Id,
  currentViewId: Id,
  currentDetailDepth: number,
): Id | undefined {
  const views = Object.values(model.views).filter(
    (view) =>
      view.rootElementId === elementId &&
      view.id !== currentViewId &&
      getViewDetailDepth(view) > currentDetailDepth,
  );

  return (
    views.find((view) => view.perspective === 'structure')?.id ??
    views.sort(
      (left, right) =>
        getViewDetailDepth(left) - getViewDetailDepth(right) ||
        left.name.localeCompare(right.name),
    )[0]?.id
  );
}

export function buildBreadcrumb(
  model: C4Model,
  path: Id[],
): Array<{ viewId: Id; label: string }> {
  return path.flatMap((viewId) => {
    const view = model.views[viewId];
    if (!view) {
      return [];
    }

    return [
      {
        viewId,
        label: view.name,
      },
    ];
  });
}

export function getPlacementChildren(
  placements: PlacementDef[],
): Map<Id, PlacementDef[]> {
  const children = new Map<Id, PlacementDef[]>();

  for (const placement of placements) {
    if (!placement.parentPlacementId) {
      continue;
    }

    const siblings = children.get(placement.parentPlacementId) ?? [];
    siblings.push(placement);
    children.set(placement.parentPlacementId, siblings);
  }

  return children;
}
