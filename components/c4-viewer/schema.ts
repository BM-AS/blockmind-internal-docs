import { z } from 'zod';

export const IdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Must be kebab-case');

export const C4LevelSchema = z.enum(['person', 'system', 'container', 'component']);
export const RelationshipPerspectiveSchema = z.enum([
  'dataFlow',
  'security',
  'deployment',
  'runtime',
]);
export const ViewPerspectiveSchema = z.enum([
  'structure',
  'dataFlow',
  'security',
  'deployment',
]);

export const C4ElementSchema = z.object({
  id: IdSchema,
  kind: C4LevelSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  technology: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  docsUrl: z.string().startsWith('/').max(300).optional(),
});

export const ContainmentSchema = z.object({
  parentId: IdSchema,
  childId: IdSchema,
  mode: z.enum(['owns', 'references']),
});

export const C4RelationshipSchema = z.object({
  id: IdSchema,
  sourceId: IdSchema,
  targetId: IdSchema,
  label: z.string().max(200).optional(),
  technology: z.string().max(100).optional(),
  perspectives: z.array(RelationshipPerspectiveSchema).max(4).optional(),
  style: z.enum(['sync', 'async', 'event']).optional(),
});

export const PlacementDefSchema = z.object({
  placementId: IdSchema,
  elementId: IdSchema,
  parentPlacementId: IdSchema.optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  collapsed: z.boolean().optional(),
});

export const ViewDefinitionSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  rootElementId: IdSchema,
  perspective: ViewPerspectiveSchema,
  placements: z.array(PlacementDefSchema).min(1),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number().positive(),
    })
    .optional(),
  excludeRelationships: z.array(IdSchema).optional(),
});

function addCustomIssue(
  ctx: z.RefinementCtx,
  message: string,
  path: Array<string | number>,
) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path,
  });
}

export const C4ModelSchema = z
  .object({
    elements: z.record(IdSchema, C4ElementSchema),
    containment: z.array(ContainmentSchema),
    relationships: z.record(IdSchema, C4RelationshipSchema),
    views: z.record(IdSchema, ViewDefinitionSchema),
  })
  .superRefine((model, ctx) => {
    const elementIds = new Set(Object.keys(model.elements));
    const relationshipIds = new Set(Object.keys(model.relationships));
    const ownerCounts = new Map<string, number>();
    const ownerOf = new Map<string, string>();
    const containmentByParent = new Map<string, Set<string>>();

    for (const [key, element] of Object.entries(model.elements)) {
      if (key !== element.id) {
        addCustomIssue(
          ctx,
          `Element key "${key}" does not match inner id "${element.id}"`,
          ['elements', key],
        );
      }

      if (element.tags) {
        const uniqueTags = new Set(element.tags);
        if (uniqueTags.size !== element.tags.length) {
          addCustomIssue(
            ctx,
            `Element "${element.id}" contains duplicate tags`,
            ['elements', key, 'tags'],
          );
        }
      }
    }

    for (const [key, relationship] of Object.entries(model.relationships)) {
      if (key !== relationship.id) {
        addCustomIssue(
          ctx,
          `Relationship key "${key}" does not match inner id "${relationship.id}"`,
          ['relationships', key],
        );
      }
    }

    for (const [key, view] of Object.entries(model.views)) {
      if (key !== view.id) {
        addCustomIssue(
          ctx,
          `View key "${key}" does not match inner id "${view.id}"`,
          ['views', key],
        );
      }
    }

    model.containment.forEach((entry, index) => {
      if (!elementIds.has(entry.parentId)) {
        addCustomIssue(
          ctx,
          `Containment parent "${entry.parentId}" was not found`,
          ['containment', index, 'parentId'],
        );
      }

      if (!elementIds.has(entry.childId)) {
        addCustomIssue(
          ctx,
          `Containment child "${entry.childId}" was not found`,
          ['containment', index, 'childId'],
        );
      }

      if (entry.parentId === entry.childId) {
        addCustomIssue(
          ctx,
          `Containment cannot self-reference "${entry.childId}"`,
          ['containment', index],
        );
      }

      if (!containmentByParent.has(entry.parentId)) {
        containmentByParent.set(entry.parentId, new Set());
      }
      containmentByParent.get(entry.parentId)?.add(entry.childId);

      if (entry.mode === 'owns') {
        ownerCounts.set(entry.childId, (ownerCounts.get(entry.childId) ?? 0) + 1);
        if (!ownerOf.has(entry.childId)) {
          ownerOf.set(entry.childId, entry.parentId);
        }
      }
    });

    for (const [elementId, element] of Object.entries(model.elements)) {
      const ownerCount = ownerCounts.get(elementId) ?? 0;

      if (
        (element.kind === 'container' || element.kind === 'component') &&
        ownerCount !== 1
      ) {
        addCustomIssue(
          ctx,
          `Element "${elementId}" must have exactly one owning parent`,
          ['containment'],
        );
      }

      if ((element.kind === 'person' || element.kind === 'system') && ownerCount > 1) {
        addCustomIssue(
          ctx,
          `Top-level element "${elementId}" cannot have more than one owning parent`,
          ['containment'],
        );
      }
    }

    const ownerVisitState = new Map<string, 'visiting' | 'visited'>();
    const detectOwnershipCycle = (elementId: string, trail: string[]) => {
      const state = ownerVisitState.get(elementId);
      if (state === 'visiting') {
        addCustomIssue(
          ctx,
          `Ownership cycle detected: ${[...trail, elementId].join(' -> ')}`,
          ['containment'],
        );
        return;
      }

      if (state === 'visited') {
        return;
      }

      ownerVisitState.set(elementId, 'visiting');
      const parentId = ownerOf.get(elementId);
      if (parentId) {
        detectOwnershipCycle(parentId, [...trail, elementId]);
      }
      ownerVisitState.set(elementId, 'visited');
    };

    for (const elementId of elementIds) {
      detectOwnershipCycle(elementId, []);
    }

    for (const [key, relationship] of Object.entries(model.relationships)) {
      if (!elementIds.has(relationship.sourceId)) {
        addCustomIssue(
          ctx,
          `Relationship source "${relationship.sourceId}" was not found`,
          ['relationships', key, 'sourceId'],
        );
      }

      if (!elementIds.has(relationship.targetId)) {
        addCustomIssue(
          ctx,
          `Relationship target "${relationship.targetId}" was not found`,
          ['relationships', key, 'targetId'],
        );
      }
    }

    for (const [viewKey, view] of Object.entries(model.views)) {
      if (!elementIds.has(view.rootElementId)) {
        addCustomIssue(
          ctx,
          `View root "${view.rootElementId}" was not found`,
          ['views', viewKey, 'rootElementId'],
        );
      }

      const placementIds = new Set<string>();
      const elementPlacements = new Set<string>();
      const placementById = new Map<string, z.infer<typeof PlacementDefSchema>>();

      view.placements.forEach((placement, index) => {
        if (placementIds.has(placement.placementId)) {
          addCustomIssue(
            ctx,
            `Duplicate placementId "${placement.placementId}" in view "${viewKey}"`,
            ['views', viewKey, 'placements', index, 'placementId'],
          );
        }
        placementIds.add(placement.placementId);

        if (elementPlacements.has(placement.elementId)) {
          addCustomIssue(
            ctx,
            `Duplicate element placement "${placement.elementId}" in view "${viewKey}"`,
            ['views', viewKey, 'placements', index, 'elementId'],
          );
        }
        elementPlacements.add(placement.elementId);

        if (!elementIds.has(placement.elementId)) {
          addCustomIssue(
            ctx,
            `Placement element "${placement.elementId}" was not found`,
            ['views', viewKey, 'placements', index, 'elementId'],
          );
        }

        if (placement.parentPlacementId) {
          const parentPlacement = placementById.get(placement.parentPlacementId);
          if (!parentPlacement) {
            addCustomIssue(
              ctx,
              `Parent placement "${placement.parentPlacementId}" must exist earlier in the placements array`,
              ['views', viewKey, 'placements', index, 'parentPlacementId'],
            );
          } else {
            const validContainment =
              containmentByParent
                .get(parentPlacement.elementId)
                ?.has(placement.elementId) ?? false;

            if (!validContainment) {
              addCustomIssue(
                ctx,
                `Placement "${placement.placementId}" nests "${placement.elementId}" under "${parentPlacement.elementId}" without a containment relationship`,
                ['views', viewKey, 'placements', index],
              );
            }
          }
        }

        placementById.set(placement.placementId, placement);
      });

      const placementVisitState = new Map<string, 'visiting' | 'visited'>();
      const detectPlacementCycle = (placementId: string, trail: string[]) => {
        const state = placementVisitState.get(placementId);
        if (state === 'visiting') {
          addCustomIssue(
            ctx,
            `Placement cycle detected in view "${viewKey}": ${[...trail, placementId].join(' -> ')}`,
            ['views', viewKey, 'placements'],
          );
          return;
        }

        if (state === 'visited') {
          return;
        }

        placementVisitState.set(placementId, 'visiting');
        const parentPlacementId = placementById.get(placementId)?.parentPlacementId;
        if (parentPlacementId) {
          detectPlacementCycle(parentPlacementId, [...trail, placementId]);
        }
        placementVisitState.set(placementId, 'visited');
      };

      for (const placementId of placementIds) {
        detectPlacementCycle(placementId, []);
      }

      for (const relationshipId of view.excludeRelationships ?? []) {
        if (!relationshipIds.has(relationshipId)) {
          addCustomIssue(
            ctx,
            `Excluded relationship "${relationshipId}" was not found`,
            ['views', viewKey, 'excludeRelationships'],
          );
        }
      }
    }
  });

export type Id = z.infer<typeof IdSchema>;
export type C4Level = z.infer<typeof C4LevelSchema>;
export type ViewPerspective = z.infer<typeof ViewPerspectiveSchema>;
export type RelationshipPerspective = z.infer<typeof RelationshipPerspectiveSchema>;
export type C4Element = z.infer<typeof C4ElementSchema>;
export type Containment = z.infer<typeof ContainmentSchema>;
export type C4Relationship = z.infer<typeof C4RelationshipSchema>;
export type PlacementDef = z.infer<typeof PlacementDefSchema>;
export type ViewDefinition = z.infer<typeof ViewDefinitionSchema>;
export type C4Model = z.infer<typeof C4ModelSchema>;

export function parseC4Model(model: unknown): C4Model {
  return C4ModelSchema.parse(model);
}
