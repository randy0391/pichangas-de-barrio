import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Download, 
  Copy, 
  Printer, 
  Search, 
  X, 
  Calendar, 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowUpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Phone, 
  Eye, 
  Sliders, 
  History, 
  DollarSign, 
  FileSpreadsheet, 
  Trophy, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Pagination } from '@/components/ui/Pagination';

export type ReportSubTab = 'recharges' | 'with_balance' | 'without_balance' | 'all_recharged';

interface RechargeItem {
  id: number;
  user_id: number;
  user_name: string;
  user_nickname?: string | null;
  user_phone?: string | null;
  user_dni?: string | null;
  user_avatar?: string | null;
  amount: number;
  balance_after: number;
  description?: string | null;
  receipt_path?: string | null;
  status: 'aprobado' | 'pendiente' | 'rechazado';
  approver_name?: string | null;
  approved_at?: string | null;
  created_at?: string | null;
  date_formatted?: string | null;
}

interface PlayerWithBalanceItem {
  user_id: number;
  user_name: string;
  user_nickname?: string | null;
  user_phone?: string | null;
  user_dni?: string | null;
  user_avatar?: string | null;
  current_balance: number;
  total_recharged: number;
  total_spent: number;
  recharges_count: number;
  last_recharge_date?: string | null;
}

interface PlayerWithoutBalanceItem {
  user_id: number;
  user_name: string;
  user_nickname?: string | null;
  user_phone?: string | null;
  user_dni?: string | null;
  user_avatar?: string | null;
  current_balance: number;
  is_negative: boolean;
  has_recharged_before: boolean;
  total_recharged: number;
  recharges_count: number;
  last_recharge_date?: string | null;
}

interface RechargedPlayerItem {
  user_id: number;
  user_name: string;
  user_nickname?: string | null;
  user_phone?: string | null;
  user_dni?: string | null;
  user_avatar?: string | null;
  current_balance: number;
  total_recharged: number;
  recharges_count: number;
  average_recharge: number;
  first_recharge_date?: string | null;
  last_recharge_date?: string | null;
}

interface ReportApiResponse {
  global_stats: {
    total_balance_circulation: number;
    players_with_balance_count: number;
    total_with_balance_amount: number;
    players_without_balance_count: number;
    players_in_debt_count: number;
    total_debt_amount: number;
    total_approved_recharges_amount: number;
    total_approved_recharges_count: number;
    total_pending_recharges_count: number;
    unique_rechargers_count: number;
    total_users_count: number;
  };
  period_stats?: {
    period_approved_amount: number;
    period_total_count: number;
    period_approved_count: number;
    period_pending_count: number;
    period_rejected_count: number;
  };
  data: any[];
}

interface AdminWalletReportsSectionProps {
  onViewReceipt?: (receipt: { url: string; playerName?: string; amount?: string }) => void;
  onOpenPlayerHistory?: (user: { id: number; name: string; balance: string }) => void;
  onOpenAdjustModal?: (user: { id: number; name: string; balance: string }) => void;
}

export const AdminWalletReportsSection: React.FC<AdminWalletReportsSectionProps> = ({
  onViewReceipt,
  onOpenPlayerHistory,
  onOpenAdjustModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('recharges');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rechargeStatus, setRechargeStatus] = useState<'all' | 'aprobado' | 'pendiente' | 'rechazado'>('all');
  const [withoutBalanceSubFilter, setWithoutBalanceSubFilter] = useState<'all' | 'zero' | 'negative'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Fetch report data directly from live production endpoints (instant 200 OK, zero console 404 errors)
  const { data: response, isLoading, isFetching, refetch } = useQuery<ReportApiResponse>({
    queryKey: [
      'admin-wallets-report-live',
      activeSubTab,
      startDate,
      endDate,
      rechargeStatus,
      withoutBalanceSubFilter,
      searchQuery
    ],
    staleTime: 30000,
    queryFn: async () => {
      // Query directly from live production endpoints that are always available
      const [walletsRes, rechargesRes] = await Promise.all([
        api.get('/admin/wallets', { params: { all: true, per_page: 500 } }).catch(() => ({ data: { data: [] } })),
        api.get<any>('/admin/wallets/recharges', { params: { all: true, per_page: 1000 } }).catch(() => ({ data: { data: [] } }))
      ]);

      const rawWallets: any[] = (walletsRes.data as any).data || [];
      const rawRecharges: any[] = (rechargesRes.data as any).data || [];

      // Compute Global Stats
      const totalBalanceCirculation = rawWallets.reduce((acc, w) => acc + parseFloat(w.balance || '0'), 0);
      const withBal = rawWallets.filter(w => parseFloat(w.balance || '0') > 0);
      const withoutBal = rawWallets.filter(w => parseFloat(w.balance || '0') <= 0);
      const inDebt = rawWallets.filter(w => parseFloat(w.balance || '0') < 0);
      const totalDebt = inDebt.reduce((acc, w) => acc + Math.abs(parseFloat(w.balance || '0')), 0);

      const approvedRecharges = rawRecharges.filter(r => r.status === 'aprobado');
      const totalApprovedRechargesAmount = approvedRecharges.reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);
      const uniqueRechargers = new Set(approvedRecharges.map(r => r.user_id || r.user?.id).filter(Boolean));

      const globalStats = {
        total_balance_circulation: totalBalanceCirculation,
        players_with_balance_count: withBal.length,
        total_with_balance_amount: withBal.reduce((acc, w) => acc + parseFloat(w.balance || '0'), 0),
        players_without_balance_count: withoutBal.length,
        players_in_debt_count: inDebt.length,
        total_debt_amount: totalDebt,
        total_approved_recharges_amount: totalApprovedRechargesAmount,
        total_approved_recharges_count: approvedRecharges.length,
        total_pending_recharges_count: rawRecharges.filter(r => r.status === 'pendiente').length,
        unique_rechargers_count: uniqueRechargers.size,
        total_users_count: rawWallets.length,
      };

      const matchesSearch = (name = '', nickname = '', phone = '', dni = '') => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          name.toLowerCase().includes(q) ||
          nickname.toLowerCase().includes(q) ||
          phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          dni.toLowerCase().includes(q)
        );
      };

      // 1. RECHARGES BY DATE
      if (activeSubTab === 'recharges') {
        const list = rawRecharges.filter(r => {
          const u = r.user;
          const uName = u?.name || 'Jugador';
          const uNick = u?.nickname || '';
          const uPhone = u?.phone || '';
          const uDni = u?.dni || '';
          if (!matchesSearch(uName, uNick, uPhone, uDni)) return false;

          if (rechargeStatus !== 'all' && r.status !== rechargeStatus) return false;

          if (startDate) {
            const rDate = (r.created_at || '').slice(0, 10);
            if (rDate < startDate) return false;
          }
          if (endDate) {
            const rDate = (r.created_at || '').slice(0, 10);
            if (rDate > endDate) return false;
          }
          return true;
        });

        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const periodApproved = list.filter(r => r.status === 'aprobado');
        const periodApprovedAmount = periodApproved.reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);

        const items: RechargeItem[] = list.map(r => ({
          id: r.id,
          user_id: r.user_id || r.user?.id,
          user_name: r.user?.name || 'Jugador',
          user_nickname: r.user?.nickname || null,
          user_phone: r.user?.phone || null,
          user_dni: r.user?.dni || null,
          user_avatar: r.user?.avatar || null,
          amount: parseFloat(r.amount || '0'),
          balance_after: parseFloat(r.balance_after || '0'),
          description: r.description,
          receipt_path: r.receipt_path,
          status: r.status,
          approver_name: r.approver_name,
          approved_at: r.approved_at,
          created_at: r.created_at,
          date_formatted: new Date(r.created_at).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        }));

        return {
          global_stats: globalStats,
          period_stats: {
            period_approved_amount: periodApprovedAmount,
            period_total_count: list.length,
            period_approved_count: periodApproved.length,
            period_pending_count: list.filter(r => r.status === 'pendiente').length,
            period_rejected_count: list.filter(r => r.status === 'rechazado').length,
          },
          data: items
        };
      }

      // Group recharges by user for metrics in tabs 2, 3, 4
      const userRechargeMap = new Map<number, { total: number; count: number; firstDate: string; lastDate: string }>();
      approvedRecharges.forEach(r => {
        const uid = r.user_id || r.user?.id;
        if (!uid) return;
        const cur = userRechargeMap.get(uid) || { total: 0, count: 0, firstDate: r.created_at, lastDate: r.created_at };
        cur.total += parseFloat(r.amount || '0');
        cur.count += 1;
        if (new Date(r.created_at).getTime() < new Date(cur.firstDate).getTime()) cur.firstDate = r.created_at;
        if (new Date(r.created_at).getTime() > new Date(cur.lastDate).getTime()) cur.lastDate = r.created_at;
        userRechargeMap.set(uid, cur);
      });

      // 2. WITH BALANCE (> 0)
      if (activeSubTab === 'with_balance') {
        const filtered = withBal.filter(w => {
          const u = w.user;
          return matchesSearch(u?.name, u?.nickname, u?.phone, u?.dni);
        });

        filtered.sort((a, b) => parseFloat(b.balance || '0') - parseFloat(a.balance || '0'));

        const items: PlayerWithBalanceItem[] = filtered.map(w => {
          const uid = w.user?.id || w.user_id;
          const recInfo = userRechargeMap.get(uid);
          const bal = parseFloat(w.balance || '0');
          const totRec = recInfo?.total || 0;
          const spent = Math.max(0, totRec - bal);

          return {
            user_id: uid,
            user_name: w.user?.name || 'Jugador',
            user_nickname: w.user?.nickname || null,
            user_phone: w.user?.phone || null,
            user_dni: w.user?.dni || null,
            user_avatar: w.user?.avatar || null,
            current_balance: bal,
            total_recharged: totRec,
            total_spent: spent,
            recharges_count: recInfo?.count || 0,
            last_recharge_date: recInfo?.lastDate ? new Date(recInfo.lastDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
          };
        });

        return {
          global_stats: globalStats,
          data: items
        };
      }

      // 3. WITHOUT BALANCE (<= 0)
      if (activeSubTab === 'without_balance') {
        let filtered = withoutBal.filter(w => {
          const u = w.user;
          return matchesSearch(u?.name, u?.nickname, u?.phone, u?.dni);
        });

        if (withoutBalanceSubFilter === 'zero') {
          filtered = filtered.filter(w => parseFloat(w.balance || '0') === 0);
        } else if (withoutBalanceSubFilter === 'negative') {
          filtered = filtered.filter(w => parseFloat(w.balance || '0') < 0);
        }

        filtered.sort((a, b) => parseFloat(a.balance || '0') - parseFloat(b.balance || '0'));

        const items: PlayerWithoutBalanceItem[] = filtered.map(w => {
          const uid = w.user?.id || w.user_id;
          const recInfo = userRechargeMap.get(uid);
          const bal = parseFloat(w.balance || '0');

          return {
            user_id: uid,
            user_name: w.user?.name || 'Jugador',
            user_nickname: w.user?.nickname || null,
            user_phone: w.user?.phone || null,
            user_dni: w.user?.dni || null,
            user_avatar: w.user?.avatar || null,
            current_balance: bal,
            is_negative: bal < 0,
            has_recharged_before: !!recInfo && recInfo.count > 0,
            total_recharged: recInfo?.total || 0,
            recharges_count: recInfo?.count || 0,
            last_recharge_date: recInfo?.lastDate ? new Date(recInfo.lastDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
          };
        });

        return {
          global_stats: globalStats,
          data: items
        };
      }

      // 4. ALL RECHARGED PLAYERS
      if (activeSubTab === 'all_recharged') {
        const walletMap = new Map<number, any>();
        rawWallets.forEach(w => {
          const uid = w.user?.id || w.user_id;
          if (uid) walletMap.set(uid, w);
        });

        const list: RechargedPlayerItem[] = [];
        userRechargeMap.forEach((recInfo, uid) => {
          const w = walletMap.get(uid);
          const u = w?.user;
          const uName = u?.name || 'Jugador';
          const uNick = u?.nickname || '';
          const uPhone = u?.phone || '';
          const uDni = u?.dni || '';

          if (!matchesSearch(uName, uNick, uPhone, uDni)) return;

          const bal = parseFloat(w?.balance || '0');
          const avg = recInfo.count > 0 ? parseFloat((recInfo.total / recInfo.count).toFixed(2)) : 0;

          list.push({
            user_id: uid,
            user_name: uName,
            user_nickname: uNick || null,
            user_phone: uPhone || null,
            user_dni: uDni || null,
            user_avatar: u?.avatar || null,
            current_balance: bal,
            total_recharged: recInfo.total,
            recharges_count: recInfo.count,
            average_recharge: avg,
            first_recharge_date: recInfo.firstDate ? new Date(recInfo.firstDate).toLocaleDateString('es-PE') : null,
            last_recharge_date: recInfo.lastDate ? new Date(recInfo.lastDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
          });
        });

        list.sort((a, b) => b.total_recharged - a.total_recharged);

        return {
          global_stats: globalStats,
          data: list
        };
      }

      return {
        global_stats: globalStats,
        data: []
      };
    }
  });

  const globalStats = response?.global_stats;
  const periodStats = response?.period_stats;
  const rawData: any[] = response?.data || [];

  // Client-side pagination over rows
  const totalPages = Math.ceil(rawData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rawData.slice(start, start + pageSize);
  }, [rawData, currentPage, pageSize]);

  // Quick Date presets
  const applyDatePreset = (preset: 'today' | '7days' | 'month' | 'year' | 'all') => {
    setCurrentPage(1);
    if (preset === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'year') {
      const now = new Date();
      const first = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Export to Excel (CSV with UTF-8 BOM & Semicolon)
  const exportToExcel = () => {
    if (!rawData.length) {
      toast.info('No hay datos en el reporte actual para exportar.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    const todayStr = new Date().toISOString().split('T')[0];

    if (activeSubTab === 'recharges') {
      csvContent += 'N°;Fecha y Hora;Jugador;Apodo;Celular;DNI;Monto (S/);Saldo Posterior (S/);Estado;Aprobado Por;Fecha Aprobación;Descripción\n';
      (rawData as RechargeItem[]).forEach((tx, idx) => {
        const date = `"${tx.date_formatted || tx.created_at || ''}"`;
        const name = `"${tx.user_name || 'Jugador'}"`;
        const nick = `"${tx.user_nickname || ''}"`;
        const phone = `"${tx.user_phone || ''}"`;
        const dni = `"${tx.user_dni || ''}"`;
        const amount = tx.amount.toFixed(2);
        const balAfter = tx.balance_after.toFixed(2);
        const status = `"${(tx.status || 'pendiente').toUpperCase()}"`;
        const approver = `"${tx.approver_name || ''}"`;
        const appDate = `"${tx.approved_at || ''}"`;
        const desc = `"${(tx.description || '').replace(/"/g, '""')}"`;
        csvContent += `${idx + 1};${date};${name};${nick};${phone};${dni};${amount};${balAfter};${status};${approver};${appDate};${desc}\n`;
      });
      downloadFile(csvContent, `reporte_recargas_por_fecha_${todayStr}.csv`);
      toast.success(`Exportadas ${rawData.length} recargas a Excel (CSV)`);
    } else if (activeSubTab === 'with_balance') {
      csvContent += 'N°;Jugador;Apodo;Celular;DNI;Saldo Actual (S/);Total Recargado (S/);Total Gastado (S/);N° Recargas;Última Recarga\n';
      (rawData as PlayerWithBalanceItem[]).forEach((p, idx) => {
        const name = `"${p.user_name || 'Jugador'}"`;
        const nick = `"${p.user_nickname || ''}"`;
        const phone = `"${p.user_phone || ''}"`;
        const dni = `"${p.user_dni || ''}"`;
        const bal = p.current_balance.toFixed(2);
        const rec = p.total_recharged.toFixed(2);
        const spent = p.total_spent.toFixed(2);
        const count = p.recharges_count;
        const lastDate = `"${p.last_recharge_date || 'Sin recargas'}"`;
        csvContent += `${idx + 1};${name};${nick};${phone};${dni};${bal};${rec};${spent};${count};${lastDate}\n`;
      });
      downloadFile(csvContent, `reporte_jugadores_con_saldo_${todayStr}.csv`);
      toast.success(`Exportados ${rawData.length} jugadores con saldo a Excel`);
    } else if (activeSubTab === 'without_balance') {
      csvContent += 'N°;Jugador;Apodo;Celular;DNI;Saldo Actual (S/);Estado Saldo;¿Ha Recargado Antes?;Total Recargado Histórico (S/);N° Recargas;Última Recarga\n';
      (rawData as PlayerWithoutBalanceItem[]).forEach((p, idx) => {
        const name = `"${p.user_name || 'Jugador'}"`;
        const nick = `"${p.user_nickname || ''}"`;
        const phone = `"${p.user_phone || ''}"`;
        const dni = `"${p.user_dni || ''}"`;
        const bal = p.current_balance.toFixed(2);
        const state = p.current_balance < 0 ? 'EN DEUDA' : 'SALDO CERO (S/ 0.00)';
        const hasRec = p.has_recharged_before ? 'SI' : 'NO';
        const totRec = p.total_recharged.toFixed(2);
        const count = p.recharges_count;
        const lastDate = `"${p.last_recharge_date || '-'}"`;
        csvContent += `${idx + 1};${name};${nick};${phone};${dni};${bal};${state};${hasRec};${totRec};${count};${lastDate}\n`;
      });
      downloadFile(csvContent, `reporte_jugadores_sin_saldo_${todayStr}.csv`);
      toast.success(`Exportados ${rawData.length} jugadores sin saldo a Excel`);
    } else if (activeSubTab === 'all_recharged') {
      csvContent += 'Ranking;Jugador;Apodo;Celular;DNI;Total Recargado (S/);N° Recargas;Promedio Recarga (S/);Saldo Actual (S/);Primera Recarga;Última Recarga\n';
      (rawData as RechargedPlayerItem[]).forEach((p, idx) => {
        const name = `"${p.user_name || 'Jugador'}"`;
        const nick = `"${p.user_nickname || ''}"`;
        const phone = `"${p.user_phone || ''}"`;
        const dni = `"${p.user_dni || ''}"`;
        const tot = p.total_recharged.toFixed(2);
        const count = p.recharges_count;
        const avg = p.average_recharge.toFixed(2);
        const bal = p.current_balance.toFixed(2);
        const first = `"${p.first_recharge_date || '-'}"`;
        const last = `"${p.last_recharge_date || '-'}"`;
        csvContent += `${idx + 1};${name};${nick};${phone};${dni};${tot};${count};${avg};${bal};${first};${last}\n`;
      });
      downloadFile(csvContent, `reporte_todos_los_recargadores_${todayStr}.csv`);
      toast.success(`Exportados ${rawData.length} recargadores a Excel`);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy structured report summary to clipboard for WhatsApp
  const copyReportForWhatsApp = async () => {
    if (!rawData.length) {
      toast.info('No hay datos en el reporte actual para copiar.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let message = '';

    if (activeSubTab === 'recharges') {
      const items = rawData as RechargeItem[];
      const approvedTotal = (periodStats?.period_approved_amount ?? 0).toFixed(2);
      const totalCount = periodStats?.period_total_count ?? items.length;
      const approvedCount = periodStats?.period_approved_count ?? items.filter(x => x.status === 'aprobado').length;
      const pendingCount = periodStats?.period_pending_count ?? items.filter(x => x.status === 'pendiente').length;

      message = `📊 *REPORTE DE RECARGAS DE BILLETERA POR FECHA*\n`;
      message += `⚽ *Club Pichangas de Barrio FC*\n`;
      message += `📅 *Fecha de emisión:* ${todayStr}\n`;
      if (startDate && endDate) {
        message += `🗓️ *Periodo:* ${startDate} al ${endDate}\n`;
      } else if (startDate) {
        message += `🗓️ *Desde:* ${startDate}\n`;
      }
      message += `-------------------------------------------\n`;
      message += `💰 *Monto Total Aprobado:* S/ ${approvedTotal}\n`;
      message += `🧾 *Total de Recargas:* ${totalCount} (Aprobadas: ${approvedCount} | Pendientes: ${pendingCount})\n`;
      message += `-------------------------------------------\n\n`;
      message += `*DETALLE DE JUGADORES:*\n`;

      items.slice(0, 100).forEach((tx, i) => {
        const phone = tx.user_phone ? ` (📱 ${tx.user_phone})` : '';
        const status = tx.status === 'aprobado' ? '✅ Aprobado' : tx.status === 'pendiente' ? '⏳ Pendiente' : '❌ Rechazado';
        message += `${i + 1}. *${tx.user_name}*: S/ ${tx.amount.toFixed(2)} - ${tx.date_formatted || ''} [${status}]${phone}\n`;
      });

      if (items.length > 100) {
        message += `\n_...y ${items.length - 100} recargas más (ver reporte completo en Excel)._\n`;
      }
    } else if (activeSubTab === 'with_balance') {
      const items = rawData as PlayerWithBalanceItem[];
      const totalBal = items.reduce((acc, p) => acc + p.current_balance, 0).toFixed(2);

      message = `🟢 *REPORTE DE JUGADORES CON SALDO DISPONIBLE*\n`;
      message += `⚽ *Club Pichangas de Barrio FC*\n`;
      message += `📅 *Fecha:* ${todayStr}\n`;
      message += `-------------------------------------------\n`;
      message += `👥 *Total jugadores con saldo:* ${items.length}\n`;
      message += `💵 *Saldo total a favor acumulado:* S/ ${totalBal}\n`;
      message += `-------------------------------------------\n\n`;
      message += `*LISTA DE SALDOS:*\n`;

      items.forEach((p, i) => {
        const nick = p.user_nickname ? ` "${p.user_nickname}"` : '';
        const phone = p.user_phone ? ` | 📱 ${p.user_phone}` : '';
        message += `${i + 1}. *${p.user_name}${nick}*: S/ ${p.current_balance.toFixed(2)}${phone}\n`;
      });
    } else if (activeSubTab === 'without_balance') {
      const items = rawData as PlayerWithoutBalanceItem[];
      const inDebt = items.filter(p => p.current_balance < 0);
      const totalDebt = inDebt.reduce((acc, p) => acc + Math.abs(p.current_balance), 0).toFixed(2);

      message = `🔴 *REPORTE DE JUGADORES SIN SALDO / EN DEUDA*\n`;
      message += `⚽ *Club Pichangas de Barrio FC*\n`;
      message += `📅 *Fecha:* ${todayStr}\n`;
      message += `-------------------------------------------\n`;
      message += `👥 *Total jugadores sin saldo:* ${items.length}\n`;
      message += `⚠️ *Jugadores en deuda:* ${inDebt.length} (Deuda acumulada: S/ ${totalDebt})\n`;
      message += `-------------------------------------------\n\n`;

      if (inDebt.length > 0) {
        message += `*⚠️ JUGADORES EN DEUDA:*\n`;
        inDebt.forEach((p, i) => {
          const phone = p.user_phone ? ` | 📱 ${p.user_phone}` : '';
          message += `${i + 1}. *${p.user_name}*: -S/ ${Math.abs(p.current_balance).toFixed(2)}${phone}\n`;
        });
        message += `\n`;
      }

      message += `*JUGADORES CON SALDO S/ 0.00:*\n`;
      const zeroItems = items.filter(p => p.current_balance === 0);
      zeroItems.slice(0, 80).forEach((p, i) => {
        const phone = p.user_phone ? ` | 📱 ${p.user_phone}` : '';
        const recBefore = p.has_recharged_before ? ' (Ha recargado antes)' : ' (Nuevo/Sin recargas)';
        message += `${i + 1}. ${p.user_name}: S/ 0.00${recBefore}${phone}\n`;
      });

      if (zeroItems.length > 80) {
        message += `\n_...y ${zeroItems.length - 80} jugadores más._\n`;
      }
    } else if (activeSubTab === 'all_recharged') {
      const items = rawData as RechargedPlayerItem[];
      const totalRec = items.reduce((acc, p) => acc + p.total_recharged, 0).toFixed(2);

      message = `🏆 *DIRECTORIO DE JUGADORES QUE HAN RECARGADO*\n`;
      message += `⚽ *Club Pichangas de Barrio FC*\n`;
      message += `📅 *Fecha:* ${todayStr}\n`;
      message += `-------------------------------------------\n`;
      message += `👥 *Jugadores que han recargado:* ${items.length}\n`;
      message += `💰 *Total histórico recaudado:* S/ ${totalRec}\n`;
      message += `-------------------------------------------\n\n`;
      message += `*RANKING DE RECARGADORES:*\n`;

      items.slice(0, 100).forEach((p, i) => {
        const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `;
        const phone = p.user_phone ? ` | 📱 ${p.user_phone}` : '';
        message += `${medal}*${p.user_name}*: S/ ${p.total_recharged.toFixed(2)} (${p.recharges_count} recargas) | Saldo act: S/ ${p.current_balance.toFixed(2)}${phone}\n`;
      });
    }

    message += `\n-------------------------------------------\n`;
    message += `_Sistema de Billeteras Digitales • Pichangas de Barrio_`;

    await navigator.clipboard.writeText(message);
    toast.success('¡Reporte completo copiado al portapapeles para WhatsApp!');
  };

  const copySinglePlayerReminder = (name: string, phone?: string | null, balance?: number) => {
    if (!phone) {
      toast.error('Este jugador no tiene teléfono registrado.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const balText = balance !== undefined && balance < 0 ? `un saldo pendiente de -S/ ${Math.abs(balance).toFixed(2)}` : 'saldo S/ 0.00';
    const text = `Hola ${name} ⚽, te saludamos de Pichangas de Barrio. Queremos recordarte que en tu Billetera Digital cuentas con ${balText}. Puedes recargar por Yape o Plin al 960 735 653 y subir tu voucher para asegurar tu cupo en la próxima pichanga. ¡Te esperamos en la cancha!`;
    const url = `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* KPI GLOBAL CARDS HEADER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Circulation */}
        <div className="bg-slate-900/90 border border-lime-400/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total en Circulación</span>
            <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            S/ {(globalStats?.total_balance_circulation ?? 0).toFixed(2)}
          </div>
          <p className="text-xs text-lime-400/80 font-medium mt-1">Saldo disponible en todas las billeteras</p>
        </div>

        {/* Players with balance */}
        <div 
          onClick={() => { setActiveSubTab('with_balance'); setCurrentPage(1); }}
          className={`border rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl backdrop-blur-sm cursor-pointer transition-all ${
            activeSubTab === 'with_balance'
              ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Con Saldo Disponible</span>
            <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {globalStats?.players_with_balance_count ?? 0}
            <span className="text-xs font-bold text-slate-400 ml-2">jugadores</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-between">
            <span>Suma a favor: S/ {(globalStats?.total_with_balance_amount ?? 0).toFixed(2)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
          </p>
        </div>

        {/* Players without balance */}
        <div 
          onClick={() => { setActiveSubTab('without_balance'); setCurrentPage(1); }}
          className={`border rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl backdrop-blur-sm cursor-pointer transition-all ${
            activeSubTab === 'without_balance'
              ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sin Saldo / En Deuda</span>
            <div className="p-2.5 rounded-xl bg-rose-400/10 text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
            {globalStats?.players_without_balance_count ?? 0}
            <span className="text-xs font-bold text-slate-400 ml-2">jugadores</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-between">
            <span>{globalStats?.players_in_debt_count ?? 0} en deuda (S/ {(globalStats?.total_debt_amount ?? 0).toFixed(2)})</span>
            <ArrowRight className="h-3.5 w-3.5 text-rose-400" />
          </p>
        </div>

        {/* Total Rechargers */}
        <div 
          onClick={() => { setActiveSubTab('all_recharged'); setCurrentPage(1); }}
          className={`border rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl backdrop-blur-sm cursor-pointer transition-all ${
            activeSubTab === 'all_recharged'
              ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Recargadores</span>
            <div className="p-2.5 rounded-xl bg-cyan-400/10 text-cyan-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
            {globalStats?.unique_rechargers_count ?? 0}
            <span className="text-xs font-bold text-slate-400 ml-2">jugadores</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-between">
            <span>Histórico: S/ {(globalStats?.total_approved_recharges_amount ?? 0).toFixed(2)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
          </p>
        </div>
      </div>

      {/* REPORT SUB-TABS SELECTOR (Spacious 2x2 grid on mobile/tablet, 4x1 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Tab 1: Recargas por Fecha */}
        <button
          type="button"
          onClick={() => { setActiveSubTab('recharges'); setCurrentPage(1); }}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 relative overflow-hidden group shadow-lg ${
            activeSubTab === 'recharges'
              ? 'bg-gradient-to-br from-lime-400 to-lime-500 text-slate-950 border-lime-400 shadow-lime-400/20 ring-2 ring-lime-400/40'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-lime-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`p-2 rounded-xl transition-colors ${
              activeSubTab === 'recharges' ? 'bg-slate-950/15 text-slate-950' : 'bg-lime-400/10 text-lime-400'
            }`}>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
              activeSubTab === 'recharges'
                ? 'bg-slate-950 text-lime-400 shadow-sm'
                : 'bg-slate-800 text-lime-400 border border-slate-700'
            }`}>
              {activeSubTab === 'recharges'
                ? (periodStats?.period_total_count ?? rawData.length)
                : (globalStats?.total_approved_recharges_count ?? 0)}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider line-clamp-1">
              1. Recargas por Fecha
            </p>
            <p className={`text-[11px] font-medium line-clamp-1 mt-0.5 ${
              activeSubTab === 'recharges' ? 'text-slate-950/80 font-bold' : 'text-slate-400'
            }`}>
              Historial y comprobantes
            </p>
          </div>
        </button>

        {/* Tab 2: Con Saldo Disponible */}
        <button
          type="button"
          onClick={() => { setActiveSubTab('with_balance'); setCurrentPage(1); }}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 relative overflow-hidden group shadow-lg ${
            activeSubTab === 'with_balance'
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-400/20 ring-2 ring-emerald-400/40'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`p-2 rounded-xl transition-colors ${
              activeSubTab === 'with_balance' ? 'bg-slate-950/15 text-slate-950' : 'bg-emerald-400/10 text-emerald-400'
            }`}>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
              activeSubTab === 'with_balance'
                ? 'bg-slate-950 text-emerald-400 shadow-sm'
                : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
            }`}>
              {globalStats?.players_with_balance_count ?? 0}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider line-clamp-1">
              2. Con Saldo
            </p>
            <p className={`text-[11px] font-medium line-clamp-1 mt-0.5 ${
              activeSubTab === 'with_balance' ? 'text-slate-950/80 font-bold' : 'text-slate-400'
            }`}>
              Saldo a favor (&gt; S/ 0)
            </p>
          </div>
        </button>

        {/* Tab 3: Sin Saldo / En Deuda */}
        <button
          type="button"
          onClick={() => { setActiveSubTab('without_balance'); setCurrentPage(1); }}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 relative overflow-hidden group shadow-lg ${
            activeSubTab === 'without_balance'
              ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-slate-950 border-rose-400 shadow-rose-400/20 ring-2 ring-rose-400/40'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-rose-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`p-2 rounded-xl transition-colors ${
              activeSubTab === 'without_balance' ? 'bg-slate-950/15 text-slate-950' : 'bg-rose-400/10 text-rose-400'
            }`}>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
              activeSubTab === 'without_balance'
                ? 'bg-slate-950 text-rose-400 shadow-sm'
                : 'bg-slate-800 text-rose-400 border border-rose-500/30'
            }`}>
              {globalStats?.players_without_balance_count ?? 0}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider line-clamp-1">
              3. Sin Saldo / Deuda
            </p>
            <p className={`text-[11px] font-medium line-clamp-1 mt-0.5 ${
              activeSubTab === 'without_balance' ? 'text-slate-950/80 font-bold' : 'text-slate-400'
            }`}>
              Saldo S/ 0 y deudores
            </p>
          </div>
        </button>

        {/* Tab 4: Todos los que Recargaron */}
        <button
          type="button"
          onClick={() => { setActiveSubTab('all_recharged'); setCurrentPage(1); }}
          className={`p-3 sm:p-4 rounded-2xl border transition-all text-left flex flex-col justify-between gap-2.5 relative overflow-hidden group shadow-lg ${
            activeSubTab === 'all_recharged'
              ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-400/20 ring-2 ring-cyan-400/40'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className={`p-2 rounded-xl transition-colors ${
              activeSubTab === 'all_recharged' ? 'bg-slate-950/15 text-slate-950' : 'bg-cyan-400/10 text-cyan-400'
            }`}>
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
              activeSubTab === 'all_recharged'
                ? 'bg-slate-950 text-cyan-400 shadow-sm'
                : 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
            }`}>
              {globalStats?.unique_rechargers_count ?? 0}
            </span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider line-clamp-1">
              4. Recargadores
            </p>
            <p className={`text-[11px] font-medium line-clamp-1 mt-0.5 ${
              activeSubTab === 'all_recharged' ? 'text-slate-950/80 font-bold' : 'text-slate-400'
            }`}>
              Ranking histórico total
            </p>
          </div>
        </button>
      </div>

      {/* FILTER & EXPORT BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 focus-within:border-lime-400/50 focus-within:ring-1 focus-within:ring-lime-400/30 transition-all flex-1 shadow-inner">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoComplete="off"
              placeholder="Buscar por jugador, apodo, DNI o número de celular..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm w-full h-7 p-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-slate-500 hover:text-white p-0.5 rounded-lg transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Conditional Filters depending on active tab */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date range filters for Recharges & All Recharged */}
            {(activeSubTab === 'recharges' || activeSubTab === 'all_recharged') && (
              <>
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Desde:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-white text-xs font-mono outline-none border-0 focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Hasta:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-white text-xs font-mono outline-none border-0 focus:ring-0 p-0"
                  />
                </div>
              </>
            )}

            {/* Status dropdown for Recharges by date */}
            {activeSubTab === 'recharges' && (
              <select
                value={rechargeStatus}
                onChange={(e) => {
                  setRechargeStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-lime-400/50"
              >
                <option value="all">Todos los estados</option>
                <option value="aprobado">Solo Aprobados</option>
                <option value="pendiente">Solo Pendientes</option>
                <option value="rechazado">Solo Rechazados</option>
              </select>
            )}

            {/* Sub-filter for Without Balance */}
            {activeSubTab === 'without_balance' && (
              <select
                value={withoutBalanceSubFilter}
                onChange={(e) => {
                  setWithoutBalanceSubFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-lime-400/50"
              >
                <option value="all">Todos sin saldo (S/ 0.00 y deudas)</option>
                <option value="zero">Solo con saldo S/ 0.00 exacto</option>
                <option value="negative">Solo en deuda (&lt; S/ 0.00)</option>
              </select>
            )}

            {/* ACTION BUTTONS: EXPORT EXCEL & COPY WHATSAPP */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all shrink-0"
                title="Descargar este reporte formateado en Excel / CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span> Excel
              </Button>

              <Button
                type="button"
                onClick={copyReportForWhatsApp}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-lime-950/40 transition-all shrink-0"
                title="Copiar resumen y lista completa formateada para WhatsApp"
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar</span> WhatsApp
              </Button>

              <Button
                type="button"
                onClick={() => window.print()}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 hidden md:flex"
                title="Imprimir reporte oficial"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir</span>
              </Button>

              <Button
                type="button"
                onClick={() => { refetch(); toast.info('Actualizando datos de billeteras...'); }}
                variant="outline"
                className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs p-2.5 rounded-xl flex items-center justify-center shrink-0"
                title="Actualizar datos en tiempo real"
              >
                <RotateCcw className={`h-4 w-4 ${isFetching ? 'animate-spin text-lime-400' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Date presets & Quick Reset */}
        {(activeSubTab === 'recharges' || activeSubTab === 'all_recharged') && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-[11px] font-semibold mr-1">Rango rápido:</span>
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('7days')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('month')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
              >
                Este mes
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('year')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
              >
                Este año
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('all')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
              >
                Todas las fechas
              </button>
            </div>

            {(startDate || endDate || rechargeStatus !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setRechargeStatus('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors px-2 py-1"
              >
                <RotateCcw className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* REPORT CONTENT AREA */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <FootballSpinner />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Generando reporte de billeteras...</span>
        </div>
      ) : rawData.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-3xl border border-dashed border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="h-8 w-8 text-slate-500" />
          </div>
          <h4 className="text-lg font-black text-white uppercase tracking-tight">No se encontraron registros</h4>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            No hay información para los filtros y fechas seleccionadas en este reporte. Prueba ajustando el rango de fechas o los términos de búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary badge bar above table */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Mostrando <strong className="text-white">{rawData.length}</strong> {rawData.length === 1 ? 'registro' : 'registros'}
              {activeSubTab === 'recharges' && periodStats && (
                <span className="text-lime-400 ml-2">
                  (Monto total aprobado en este periodo: S/ {periodStats.period_approved_amount.toFixed(2)})
                </span>
              )}
            </span>

            <span className="text-xs text-slate-500 font-mono">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          {/* TABLE RENDER BY SUBTAB */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              {/* 1. RECHARGES BY DATE TABLE */}
              {activeSubTab === 'recharges' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                      <th className="py-3.5 px-4">Fecha y Hora</th>
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4 text-right">Monto Recargado</th>
                      <th className="py-3.5 px-4 text-right">Saldo Posterior</th>
                      <th className="py-3.5 px-4 text-center">Voucher</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {(paginatedData as RechargeItem[]).map((tx) => {
                      const phoneDigits = tx.user_phone ? tx.user_phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{tx.date_formatted || tx.created_at}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                {tx.user_avatar ? (
                                  <img src={tx.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate leading-tight font-bold text-white">
                                  {tx.user_name}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  {tx.user_nickname && (
                                    <span className="text-lime-400 font-medium truncate">
                                      "{tx.user_nickname}"
                                    </span>
                                  )}
                                  {tx.user_phone && (
                                    <a
                                      href={`https://wa.me/51${phoneDigits}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-emerald-400 flex items-center gap-0.5 transition-colors font-mono"
                                      title="Escribir por WhatsApp"
                                    >
                                      <Phone className="h-2.5 w-2.5 text-emerald-400" />
                                      <span>{tx.user_phone}</span>
                                    </a>
                                  )}
                                  {tx.user_dni && (
                                    <span className="text-slate-500 font-mono">DNI: {tx.user_dni}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-black text-base text-lime-400">
                            S/ {tx.amount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-400">
                            S/ {tx.balance_after.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {tx.receipt_path ? (
                              <button
                                onClick={() => onViewReceipt && onViewReceipt({
                                  url: tx.receipt_path!,
                                  playerName: tx.user_name,
                                  amount: String(tx.amount)
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                                title="Ver comprobante de pago"
                              >
                                <Eye className="h-3 w-3 text-purple-400" />
                                <span>Ver</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-600 italic">Sin voucher</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {tx.status === 'aprobado' && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Aprobado
                              </span>
                            )}
                            {tx.status === 'pendiente' && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Pendiente
                              </span>
                            )}
                            {tx.status === 'rechazado' && (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                                <X className="h-3 w-3" /> Rechazado
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenPlayerHistory && onOpenPlayerHistory({
                                  id: tx.user_id,
                                  name: tx.user_name,
                                  balance: String(tx.balance_after)
                                })}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Ver historial de movimientos del jugador"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                              {tx.user_phone && (
                                <a
                                  href={`https://wa.me/51${phoneDigits}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                  title="Enviar WhatsApp"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 2. PLAYERS WITH BALANCE TABLE */}
              {activeSubTab === 'with_balance' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4">Contacto</th>
                      <th className="py-3.5 px-4 text-right">Saldo Actual</th>
                      <th className="py-3.5 px-4 text-right">Total Recargado</th>
                      <th className="py-3.5 px-4 text-right">Total Gastado</th>
                      <th className="py-3.5 px-4 text-center">N° Recargas</th>
                      <th className="py-3.5 px-4 text-center">Última Recarga</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {(paginatedData as PlayerWithBalanceItem[]).map((p) => {
                      const phoneDigits = p.user_phone ? p.user_phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={p.user_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {p.user_avatar ? (
                                  <img src={p.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate leading-tight font-bold text-white">
                                  {p.user_name}
                                </span>
                                {p.user_nickname && (
                                  <span className="text-[11px] text-lime-400 font-semibold block truncate">
                                    "{p.user_nickname}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {p.user_phone ? (
                                <a
                                  href={`https://wa.me/51${phoneDigits}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                  title="Chatear por WhatsApp"
                                >
                                  <Phone className="h-3 w-3 text-emerald-400" />
                                  <span>{p.user_phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">Sin teléfono</span>
                              )}
                              {p.user_dni && (
                                <span className="text-[11px] font-mono text-slate-500 block">DNI: {p.user_dni}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-mono font-black text-lg text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                              S/ {p.current_balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-lime-400 font-bold">
                            S/ {p.total_recharged.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-400">
                            S/ {p.total_spent.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white font-mono text-xs font-bold">
                              {p.recharges_count}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                            {p.last_recharge_date || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenPlayerHistory && onOpenPlayerHistory({
                                  id: p.user_id,
                                  name: p.user_name,
                                  balance: String(p.current_balance)
                                })}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                                title="Ver historial de movimientos"
                              >
                                <History className="h-3 w-3" />
                                <span>Historial</span>
                              </button>
                              <button
                                onClick={() => onOpenAdjustModal && onOpenAdjustModal({
                                  id: p.user_id,
                                  name: p.user_name,
                                  balance: String(p.current_balance)
                                })}
                                className="p-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 transition-colors"
                                title="Ajustar saldo manual"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 3. PLAYERS WITHOUT BALANCE TABLE */}
              {activeSubTab === 'without_balance' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4">Contacto</th>
                      <th className="py-3.5 px-4 text-right">Saldo Actual</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-center">¿Ha Recargado Antes?</th>
                      <th className="py-3.5 px-4 text-right">Total Histórico</th>
                      <th className="py-3.5 px-4 text-center">Última Recarga</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {(paginatedData as PlayerWithoutBalanceItem[]).map((p) => {
                      const isDebt = p.current_balance < 0;
                      return (
                        <tr key={p.user_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-full bg-slate-800 border flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${
                                isDebt ? 'border-red-500/40' : 'border-slate-700'
                              }`}>
                                {p.user_avatar ? (
                                  <img src={p.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate leading-tight font-bold text-white">
                                  {p.user_name}
                                </span>
                                {p.user_nickname && (
                                  <span className="text-[11px] text-slate-400 font-semibold block truncate">
                                    "{p.user_nickname}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {p.user_phone ? (
                                <button
                                  type="button"
                                  onClick={() => copySinglePlayerReminder(p.user_name, p.user_phone, p.current_balance)}
                                  className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                  title="Enviar recordatorio de recarga por WhatsApp"
                                >
                                  <Phone className="h-3 w-3 text-emerald-400" />
                                  <span>{p.user_phone}</span>
                                </button>
                              ) : (
                                <span className="text-slate-600 text-xs">Sin teléfono</span>
                              )}
                              {p.user_dni && (
                                <span className="text-[11px] font-mono text-slate-500 block">DNI: {p.user_dni}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className={`font-mono font-black text-base px-2.5 py-1 rounded-xl border ${
                              isDebt 
                                ? 'text-red-400 bg-red-500/10 border-red-500/30' 
                                : 'text-slate-400 bg-slate-800/80 border-slate-700'
                            }`}>
                              S/ {p.current_balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isDebt ? (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> En Deuda
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
                                Saldo S/ 0.00
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {p.has_recharged_before ? (
                              <span className="text-xs font-bold text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full">
                                Sí ({p.recharges_count} {p.recharges_count === 1 ? 'vez' : 'veces'})
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">No ha recargado</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-300">
                            S/ {p.total_recharged.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                            {p.last_recharge_date || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {p.user_phone && (
                                <button
                                  type="button"
                                  onClick={() => copySinglePlayerReminder(p.user_name, p.user_phone, p.current_balance)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors inline-flex items-center gap-1"
                                  title="Enviar recordatorio de recarga por WhatsApp"
                                >
                                  <Phone className="h-3 w-3" />
                                  <span>Recordar</span>
                                </button>
                              )}
                              <button
                                onClick={() => onOpenAdjustModal && onOpenAdjustModal({
                                  id: p.user_id,
                                  name: p.user_name,
                                  balance: String(p.current_balance)
                                })}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Ajustar saldo o cancelar deuda"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 4. ALL RECHARGED PLAYERS TABLE */}
              {activeSubTab === 'all_recharged' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                      <th className="py-3.5 px-4 text-center">Ranking</th>
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4">Contacto</th>
                      <th className="py-3.5 px-4 text-right">Total Histórico Recargado</th>
                      <th className="py-3.5 px-4 text-center">N° Recargas</th>
                      <th className="py-3.5 px-4 text-right">Ticket Promedio</th>
                      <th className="py-3.5 px-4 text-right">Saldo Actual</th>
                      <th className="py-3.5 px-4 text-center">Primera Recarga</th>
                      <th className="py-3.5 px-4 text-center">Última Recarga</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {(paginatedData as RechargedPlayerItem[]).map((p, idx) => {
                      const rank = (currentPage - 1) * pageSize + idx + 1;
                      const phoneDigits = p.user_phone ? p.user_phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={p.user_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-black font-mono">
                            {rank === 1 ? (
                              <span className="text-xl">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-xl">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-xl">🥉</span>
                            ) : (
                              <span className="text-xs text-slate-500">#{rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {p.user_avatar ? (
                                  <img src={p.user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate leading-tight font-bold text-white">
                                  {p.user_name}
                                </span>
                                {p.user_nickname && (
                                  <span className="text-[11px] text-lime-400 font-semibold block truncate">
                                    "{p.user_nickname}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {p.user_phone ? (
                                <a
                                  href={`https://wa.me/51${phoneDigits}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                  title="Chatear por WhatsApp"
                                >
                                  <Phone className="h-3 w-3 text-emerald-400" />
                                  <span>{p.user_phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                              {p.user_dni && (
                                <span className="text-[11px] font-mono text-slate-500 block">DNI: {p.user_dni}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-mono font-black text-lg text-lime-400">
                              S/ {p.total_recharged.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-white font-mono text-xs font-bold border border-slate-700">
                              {p.recharges_count}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-slate-300">
                            S/ {p.average_recharge.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className={`font-mono font-bold text-xs ${
                              p.current_balance > 0 ? 'text-emerald-400' : p.current_balance < 0 ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              S/ {p.current_balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-slate-500">
                            {p.first_recharge_date || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-slate-400">
                            {p.last_recharge_date || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onOpenPlayerHistory && onOpenPlayerHistory({
                                  id: p.user_id,
                                  name: p.user_name,
                                  balance: String(p.current_balance)
                                })}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Ver historial de movimientos"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onOpenAdjustModal && onOpenAdjustModal({
                                  id: p.user_id,
                                  name: p.user_name,
                                  balance: String(p.current_balance)
                                })}
                                className="p-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 transition-colors"
                                title="Ajustar saldo"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination
                currentPage={currentPage}
                lastPage={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
