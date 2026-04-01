interface StatusNoteProps {
  date: string;
  commit: string;
}

export function StatusNote({ date, commit }: StatusNoteProps) {
  return (
    <p className="mt-10 text-sm text-fd-muted-foreground">
      <strong>Last verified:</strong> {date} against commit <code>{commit}</code>
    </p>
  );
}
