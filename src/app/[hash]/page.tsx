import type { Metadata } from 'next';
import WeddingAppPage from '../page';
import {
  buildInvitationOpenGraphMetadata,
  getAllStaticInvitationHashes,
} from '@/lib/ogInvitationMetadata';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllStaticInvitationHashes();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }> | { hash: string };
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const hash = decodeURIComponent(resolvedParams?.hash || '');
  return buildInvitationOpenGraphMetadata(hash);
}

export default function GuestHashInvitationRoutePage() {
  return <WeddingAppPage />;
}
