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

export function getOwnerId(model: C4Model, elementId: Id): Id | undefined {
  return model.containment.find(
    (containment) => containment.childId === elementId && containment.mode === 'owns',
  )?.parentId;
}

export function hasOwnedChildren(model: C4Model, elementId: Id): boolean {
  return model.containment.some(
    (containment) =>
      containment.parentId === elementId && containment.mode === 'owns',
  );
}

export function getPreferredViewId(
  model: C4Model,
  elementId: Id,
  currentViewId?: Id,
): Id | undefined {
  const views = Object.values(model.views).filter(
    (view) => view.rootElementId === elementId && view.id !== currentViewId,
  );

  return (
    views.find((view) => view.perspective === 'structure')?.id ??
    views[0]?.id
  );
}

export function buildBreadcrumb(
  model: C4Model,
  currentViewId: Id,
): Array<{ elementId: Id; viewId: Id; label: string }> {
  const currentView = model.views[currentViewId];
  const breadcrumb: Array<{ elementId: Id; viewId: Id; label: string }> = [];
  const visited = new Set<Id>();

  let currentElementId: Id | undefined = currentView?.rootElementId;
  while (currentElementId && !visited.has(currentElementId)) {
    visited.add(currentElementId);
    const element = model.elements[currentElementId];
    const viewId =
      currentElementId === currentView.rootElementId
        ? currentViewId
        : getPreferredViewId(model, currentElementId) ?? currentViewId;

    if (element) {
      breadcrumb.unshift({
        elementId: currentElementId,
        viewId,
        label: element.name,
      });
    }

    currentElementId = getOwnerId(model, currentElementId);
  }

  return breadcrumb;
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

export function isExternalElement(tags?: string[]): boolean {
  return tags?.includes('external') ?? false;
}
