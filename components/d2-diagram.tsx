interface D2DiagramProps {
  name: string;
  title?: string;
  height?: string;
}

export function D2Diagram({ name, title, height = 'auto' }: D2DiagramProps) {
  return (
    <div className="my-6 rounded-lg border overflow-hidden bg-white dark:bg-neutral-900">
      {title ? (
        <div className="px-4 py-2 border-b text-sm font-medium text-fd-muted-foreground">
          {title}
        </div>
      ) : null}
      <div className="p-4 overflow-auto" style={{ maxHeight: height }}>
        <img
          src={`/diagrams/${name}.svg`}
          alt={title ?? `Architecture diagram: ${name}`}
          className="w-full"
        />
      </div>
    </div>
  );
}
