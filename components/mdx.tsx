import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { D2Diagram } from '@/components/d2-diagram';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    D2Diagram,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
