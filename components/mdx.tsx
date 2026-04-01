import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { D2Diagram } from '@/components/d2-diagram';
import { StatusNote } from '@/components/status-note';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    D2Diagram,
    StatusNote,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
