import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atur Ulang Kata Sandi — MEPlan',
  description:
    'Pulihkan akses akun MEPlan Anda melalui tautan reset kata sandi aman sekali pakai.',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
