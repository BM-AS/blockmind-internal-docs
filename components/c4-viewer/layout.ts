import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled';
import type { C4Model, PlacementDef, ViewDefinition } from './schema';

export async function computeLayout(
  model: C4Model,
  view: ViewDefinition,
): Promise<PlacementDef[]> {
  const elk = new ELK();
  const placementMap = new Map(
    view.placements.map((placement) => [placement.placementId, placement]),
  );
  const childrenOf = new Map<string | undefined, PlacementDef[]>();

  for (const placement of view.placements) {
    const key = placement.parentPlacementId ?? undefined;
    const list = childrenOf.get(key) ?? [];
    list.push(placement);
    childrenOf.set(key, list);
  }

  const buildElkNode = (placement: PlacementDef): ElkNode => {
    const children = childrenOf.get(placement.placementId) ?? [];

    return {
      id: placement.placementId,
      width: placement.size?.width ?? 220,
      height:
        placement.size?.height ?? (children.length > 0 ? 320 : 110),
      children: children.map(buildElkNode),
      layoutOptions:
        children.length > 0
          ? {
              'elk.padding': '[top=48,left=24,bottom=24,right=24]',
            }
          : undefined,
    };
  };

  const placementByElement = new Map(
    view.placements.map((placement) => [placement.elementId, placement]),
  );
  const elkEdges = Object.values(model.relationships)
    .filter(
      (relationship) =>
        placementByElement.has(relationship.sourceId) &&
        placementByElement.has(relationship.targetId),
    )
    .map((relationship) => ({
      id: relationship.id,
      sources: [placementByElement.get(relationship.sourceId)!.placementId],
      targets: [placementByElement.get(relationship.targetId)!.placementId],
    }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '64',
      'elk.layered.spacing.nodeNodeBetweenLayers': '96',
    },
    children: (childrenOf.get(undefined) ?? []).map(buildElkNode),
    edges: elkEdges,
  };

  const layout = await elk.layout(graph);
  const positionedPlacements: PlacementDef[] = [];

  const extract = (node: ElkNode) => {
    const placement = placementMap.get(node.id);
    if (placement) {
      positionedPlacements.push({
        ...placement,
        position: {
          x: node.x ?? 0,
          y: node.y ?? 0,
        },
      });
    }

    for (const child of node.children ?? []) {
      extract(child);
    }
  };

  for (const child of layout.children ?? []) {
    extract(child);
  }

  return positionedPlacements;
}
