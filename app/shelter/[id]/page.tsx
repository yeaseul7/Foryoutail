import { permanentRedirect } from 'next/navigation';

export default async function LegacyShelterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/${encodeURIComponent(id)}`);
}
