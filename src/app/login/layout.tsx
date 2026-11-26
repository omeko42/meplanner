import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk & Daftar — MEPlan',
  description:
    'Masuk ke ruang kerja Planner Studio MEPlan atau buat ruang kerja undangan digital gratis.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
