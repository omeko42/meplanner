import type { Metadata } from 'next';
import WeddingAppPage from '../page';
import { buildInvitationOpenGraphMetadata } from '@/lib/ogInvitationMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const hash = decodeURIComponent(resolvedParams?.hash || '');
  return buildInvitationOpenGraphMetadata(hash);
}

export default function GuestHashInvitationRoutePage() {
  return <WeddingAppPage />;
}
