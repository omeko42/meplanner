import { BrandLoader } from '@/components/ui/BrandLoader';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <BrandLoader size="lg" />
    </main>
  );
}
