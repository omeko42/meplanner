'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import type { BudgetVendorItem, WeddingGuest, WeddingTask } from '@/types';

interface PlannerAnalyticsChartsProps {
  budgetItems: BudgetVendorItem[];
  guests: WeddingGuest[];
  tasks: WeddingTask[];
  hideBudget?: boolean;
}

const RSVP_COLORS: Record<string, string> = {
  Hadir: '#10b981',
  'Ragu-ragu': '#f59e0b',
  'Tidak Hadir': '#ef4444',
  'Belum Konfirmasi': '#a8a29e',
};

function formatShortRp(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
  return String(value);
}

export const PlannerAnalyticsCharts: React.FC<PlannerAnalyticsChartsProps> = ({
  budgetItems,
  guests,
  tasks,
  hideBudget = false,
}) => {
  const budgetByCategory = useMemo(() => {
    const map = new Map<string, { category: string; aktual: number; terbayar: number }>();
    for (const item of budgetItems) {
      const cat = (item.category || 'Lainnya').split(' ')[0];
      const prev = map.get(cat) || { category: cat, aktual: 0, terbayar: 0 };
      prev.aktual += Number(item.actualCost || item.estimatedCost) || 0;
      prev.terbayar += Number(item.paidAmount) || 0;
      map.set(cat, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.aktual - a.aktual).slice(0, 7);
  }, [budgetItems]);

  const rsvpBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Hadir: 0,
      'Ragu-ragu': 0,
      'Tidak Hadir': 0,
      'Belum Konfirmasi': 0,
    };
    for (const g of guests) {
      const key =
        g.rsvpStatus && counts[g.rsvpStatus] !== undefined
          ? g.rsvpStatus
          : 'Belum Konfirmasi';
      counts[key] += 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: RSVP_COLORS[name] || '#C5A059',
      }));
  }, [guests]);

  const taskDomainData = useMemo(() => {
    const map = new Map<string, { domain: string; selesai: number; sisa: number }>();
    for (const t of tasks) {
      const domain = (t.category || 'Lainnya').split(' ')[0];
      const prev = map.get(domain) || { domain, selesai: 0, sisa: 0 };
      if (t.done || t.status === 'SELESAI') {
        prev.selesai += 1;
      } else {
        prev.sisa += 1;
      }
      map.set(domain, prev);
    }
    return Array.from(map.values());
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Budget by Category (or Task Domain when Panitia) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">
                {hideBudget
                  ? 'Progres Tugas per Bidang'
                  : 'Realisasi & Pelunasan RAB per Kategori'}
              </h4>
              <p className="text-[10px] text-stone-500">
                {hideBudget
                  ? 'Perbandingan tugas selesai vs tersisa'
                  : 'Perbandingan biaya aktual vs dana sudah dibayar'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {hideBudget ? (
              <BarChart data={taskDomainData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="domain" tick={{ fontSize: 10, fill: '#57534e' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#78716c' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="selesai" name="Selesai" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="sisa" name="Tersisa" stackId="a" fill="#d6d3d1" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={budgetByCategory} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#57534e' }} />
                <YAxis tickFormatter={formatShortRp} tick={{ fontSize: 10, fill: '#78716c' }} />
                <Tooltip
                  formatter={(value) =>
                    `Rp ${Number(value || 0).toLocaleString('id-ID')}`
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="aktual" name="Kebutuhan" fill="#C5A059" radius={[4, 4, 0, 0]} />
                <Bar dataKey="terbayar" name="Terbayar" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: RSVP Distribution */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900">
                Distribusi Konfirmasi Tamu (RSVP)
              </h4>
              <p className="text-[10px] text-stone-500">
                Total {guests.length} undangan terdaftar di ruang kerja aktif
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rsvpBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={78}
                paddingAngle={3}
              >
                {rsvpBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} Tamu`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
