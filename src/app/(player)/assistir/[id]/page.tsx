export default async function AssistirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">
        Player — conteúdo #{id}
      </h1>
      <p className="text-secondary">Em construção.</p>
    </div>
  );
}
