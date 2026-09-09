import { CodeResult } from "./result";

export default async function AccessCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CodeResult id={id} />;
}
