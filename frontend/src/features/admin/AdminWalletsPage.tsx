import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import ReactDOM from 'react-dom';
import { motion } from 'motion/react';
import { 
  Wallet, CheckCircle, Clock, Search, Eye, 
  Sliders, ExternalLink, History, ArrowUpCircle, ArrowDownCircle,
  FileText, User as UserIcon, X, Calendar, RotateCcw, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { WalletTransaction, Wallet as WalletType } from '@/types';

interface PlayerHistoryTransaction {
  id: number;
  type: 'recarga' | 'descuento' | 'devolucion' | 'ajuste';
  amount: string;
  balance_after: string;
  description: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  receipt_path: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  approver_name?: string | null;
  created_at: string;
}

interface RechargesHistoryItem {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    nickname?: string;
    phone?: string;
    dni?: string;
    avatar?: string | null;
  } | null;
  type: string;
  amount: string;
  balance_after: string;
  description: string | null;
  receipt_path: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  approved_at: string | null;
  approver_name: string | null;
  created_at: string;
}

interface RechargesHistoryResponse {
  data: RechargesHistoryItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total_approved_amount: number;
    total_count: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
  };
}

export const AdminWalletsPage = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'vouchers'>('all');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    playerName?: string;
    amount?: string;
  } | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado: "${text}"`);
  };
  
  // Vouchers History filters & pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState<'all' | 'aprobado' | 'pendiente' | 'rechazado'>('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // Adjust modal state
  const [adjustModalUser, setAdjustModalUser] = useState<{ id: number; name: string; balance: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  // History modal state
  const [historyModalUser, setHistoryModalUser] = useState<{ id: number; name: string; balance: string } | null>(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: pendingData, isLoading: loadingPending } = useQuery<{ data: WalletTransaction[] }>({
    queryKey: ['admin-wallets-pending'],
    queryFn: async () => {
      const res = await api.get('/admin/wallets/pending');
      return (res.data as any).data ? res.data : { data: res.data };
    },
    enabled: activeTab === 'pending'
  });

  const { data: allWalletsData, isLoading: loadingAll } = useQuery<{
    data: WalletType[];
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }>({
    queryKey: ['admin-wallets-all', page, searchQuery],
    queryFn: async () => {
      const res = await api.get('/admin/wallets', {
        params: {
          page,
          search: searchQuery.trim() || undefined,
          per_page: 15
        }
      });
      return (res.data as any).data ? res.data : { data: res.data };
    },
    placeholderData: keepPreviousData,
    enabled: activeTab === 'all'
  });

  // Player history query
  const { data: playerHistoryData, isLoading: loadingHistory } = useQuery<{
    user: { id: number; name: string; nickname?: string; phone?: string; dni?: string; balance: string };
    transactions: PlayerHistoryTransaction[];
  }>({
    queryKey: ['admin-player-transactions', historyModalUser?.id],
    queryFn: async () => {
      const res = await api.get(`/admin/wallets/${historyModalUser?.id}/transactions`);
      return res.data;
    },
    enabled: !!historyModalUser
  });

  // Recharges / Vouchers history query
  const { data: historyData, isLoading: loadingHistoryList } = useQuery<RechargesHistoryResponse>({
    queryKey: ['admin-recharges-history', historyPage, historySearch, historyStatus, historyStartDate, historyEndDate],
    queryFn: async () => {
      const res = await api.get('/admin/wallets/recharges', {
        params: {
          page: historyPage,
          search: historySearch.trim() || undefined,
          status: historyStatus !== 'all' ? historyStatus : undefined,
          start_date: historyStartDate || undefined,
          end_date: historyEndDate || undefined,
          per_page: 15
        }
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled: activeTab === 'vouchers'
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/admin/wallets/transactions/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Recarga aprobada y saldo acreditado con exito.');
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-player-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recharges-history'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al aprobar recarga');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/admin/wallets/transactions/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Recarga rechazada.');
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-player-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recharges-history'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al rechazar recarga');
    }
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ userId, amount, description }: { userId: number; amount: string; description: string }) => {
      const res = await api.post(`/admin/wallets/${userId}/adjust`, {
        amount,
        description
      });
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success('Saldo ajustado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-player-transactions'] });
      
      // Update local state if history modal is open
      if (historyModalUser && resData?.balance) {
        setHistoryModalUser({ ...historyModalUser, balance: resData.balance });
      }
      setAdjustModalUser(null);
      setAdjustAmount('');
      setAdjustDesc('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al ajustar saldo');
    }
  });

  const pendingList = pendingData?.data || [];
  const allWallets = allWalletsData?.data || [];
  const meta = allWalletsData?.meta;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recarga': return { label: 'Recarga Yape/Plin', color: 'bg-green-500/10 text-green-400 border-green-500/30' };
      case 'descuento': return { label: 'Pago Convocatoria', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      case 'devolucion': return { label: 'Devolucion', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'ajuste': return { label: 'Ajuste Manual Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      default: return { label: type, color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Wallet className="h-8 w-8 text-lime-400" />
            Gestion de Billeteras
          </h1>
          <p className="text-slate-400 mt-1">Controla los saldos, aprueba recargas y revisa el historial de movimientos de cada jugador</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas las Billeteras ({meta?.total ?? allWallets.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === 'pending'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recargas Pendientes {pendingList.length > 0 && (
              <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">
                {pendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'vouchers'
                ? 'bg-lime-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Historial de Vouchers</span>
          </button>
        </div>
      </div>

      {/* ALL WALLETS TAB */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Search bar & total indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-lime-400/50 focus-within:ring-1 focus-within:ring-lime-400/30 transition-all w-full sm:max-w-md">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Buscar por nombre, celular o DNI..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm w-full h-7 p-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="text-slate-500 hover:text-white p-0.5 rounded-lg transition-colors"
                  title="Limpiar busqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800/80 self-start sm:self-auto">
              Total Jugadores: <span className="text-white font-black">{meta?.total ?? allWallets.length}</span>
            </div>
          </div>

          {loadingAll ? (
            <div className="py-20 flex justify-center"><FootballSpinner /></div>
          ) : (
            <>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                      <th className="py-3.5 px-4">Jugador</th>
                      <th className="py-3.5 px-4">Celular</th>
                      <th className="py-3.5 px-4">DNI</th>
                      <th className="py-3.5 px-4 text-right">Saldo Actual</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {allWallets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No se encontraron jugadores
                        </td>
                      </tr>
                    ) : (
                      allWallets.map((w) => {
                        const bal = parseFloat(w.balance || '0');
                        return (
                          <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                  {w.user?.avatar ? (
                                    <img src={w.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="block truncate leading-tight font-bold text-white">
                                      {w.user?.name || 'Desconocido'}
                                    </span>
                                    {w.user?.name && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToClipboard(w.user!.name, 'Nombre');
                                        }}
                                        className="text-slate-500 hover:text-lime-400 p-0.5 rounded transition-colors"
                                        title="Copiar nombre"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  {w.user?.nickname && (
                                    <span className="text-[11px] text-primary font-medium block truncate">
                                      "{w.user.nickname}"
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                              {w.user?.phone || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                              {w.user?.dni || '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-base whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className={bal > 0 ? 'text-lime-400' : bal < 0 ? 'text-red-400' : 'text-slate-400'}>
                                  S/ {bal.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(bal.toFixed(2), 'Saldo');
                                  }}
                                  className="text-slate-500 hover:text-lime-400 p-0.5 rounded transition-colors"
                                  title="Copiar saldo"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => setHistoryModalUser({
                                    id: w.user_id,
                                    name: w.user?.name || 'Usuario',
                                    balance: w.balance
                                  })}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 h-auto text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                                  title="Ver historial de movimientos y motivos"
                                >
                                  <History className="h-3.5 w-3.5 mr-1 text-lime-400" /> Movimientos
                                </Button>
                                <Button
                                  onClick={() => setAdjustModalUser({
                                    id: w.user_id,
                                    name: w.user?.name || 'Usuario',
                                    balance: w.balance
                                  })}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 h-auto text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                                  title="Aumentar o quitar saldo manualmente"
                                >
                                  <Sliders className="h-3.5 w-3.5 mr-1 text-primary" /> Ajustar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {meta && meta.last_page > 1 && (
              <div className="pt-2">
                <Pagination
                  currentPage={meta.current_page}
                  lastPage={meta.last_page}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div>
          {loadingPending ? (
            <div className="py-20 flex justify-center"><FootballSpinner /></div>
          ) : pendingList.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
              <CheckCircle className="h-12 w-12 text-lime-400 mx-auto mb-3 opacity-60" />
              <p className="text-lg font-bold text-white">No hay recargas pendientes</p>
              <p className="text-slate-500 text-sm mt-1">Todas las solicitudes de saldo han sido procesadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingList.map((tx) => (
                <div 
                  key={tx.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(tx.created_at).toLocaleDateString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase">Jugador</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-bold text-white leading-tight truncate">
                          {tx.user?.name || 'Desconocido'}
                        </p>
                        {tx.user?.name && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(tx.user!.name, 'Nombre')}
                            className="text-slate-400 hover:text-lime-400 px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0"
                            title="Copiar nombre del jugador"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </button>
                        )}
                      </div>
                      {tx.user?.phone && (
                        <p className="text-xs text-primary font-mono mt-0.5">📱 {tx.user.phone}</p>
                      )}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Monto a Acreditar</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-black text-lime-400">S/ {parseFloat(tx.amount).toFixed(2)}</p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(parseFloat(tx.amount).toFixed(2), 'Monto')}
                            className="text-slate-500 hover:text-lime-400 p-1 rounded transition-colors"
                            title="Copiar monto"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {tx.receipt_path && (
                        <button
                          onClick={() => setSelectedReceipt({
                            url: tx.receipt_path!,
                            playerName: tx.user?.name,
                            amount: tx.amount
                          })}
                          className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Ver Comprobante"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>Voucher</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 mt-4 border-t border-slate-800/80">
                    <Button
                      onClick={() => approveMutation.mutate(tx.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl border-0"
                    >
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(tx.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl border border-red-500/30 transition-all"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VOUCHERS HISTORY TAB */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Aprobado</p>
              <p className="text-2xl font-black text-lime-400 mt-1">
                S/ {(historyData?.stats?.total_approved_amount ?? 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">En el periodo seleccionado</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vouchers Aprobados</p>
              <p className="text-2xl font-black text-white mt-1">
                {historyData?.stats?.approved_count ?? 0}
              </p>
              <p className="text-[10px] text-green-400 mt-0.5">Saldo acreditado</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pendientes de Revision</p>
              <p className="text-2xl font-black text-yellow-400 mt-1">
                {historyData?.stats?.pending_count ?? 0}
              </p>
              <p className="text-[10px] text-yellow-500/80 mt-0.5">Por revisar o aprobar</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rechazados</p>
              <p className="text-2xl font-black text-red-400 mt-1">
                {historyData?.stats?.rejected_count ?? 0}
              </p>
              <p className="text-[10px] text-red-500/80 mt-0.5">Comprobantes no validos</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="flex items-center gap-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-lime-400/50 focus-within:ring-1 focus-within:ring-lime-400/30 transition-all flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Buscar por jugador, apodo, DNI o celular..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="bg-transparent border-0 outline-none focus:outline-none ring-0 focus:ring-0 text-white placeholder:text-slate-500 text-sm w-full h-7 p-0"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch('');
                      setHistoryPage(1);
                    }}
                    className="text-slate-500 hover:text-white p-0.5 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Date & Status filters */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Desde:</span>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => {
                      setHistoryStartDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="bg-transparent text-white text-xs font-mono outline-none border-0 focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Hasta:</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => {
                      setHistoryEndDate(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="bg-transparent text-white text-xs font-mono outline-none border-0 focus:ring-0 p-0"
                  />
                </div>

                <select
                  value={historyStatus}
                  onChange={(e) => {
                    setHistoryStatus(e.target.value as any);
                    setHistoryPage(1);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none focus:border-lime-400/50"
                >
                  <option value="all">Todos los estados</option>
                  <option value="aprobado">Solo Aprobados</option>
                  <option value="pendiente">Solo Pendientes</option>
                  <option value="rechazado">Solo Rechazados</option>
                </select>
              </div>
            </div>

            {/* Quick date presets & reset */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px] font-semibold mr-1">Accesos rápidos:</span>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setHistoryStartDate(today);
                    setHistoryEndDate(today);
                    setHistoryPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setHistoryStartDate(d.toISOString().split('T')[0]);
                    setHistoryEndDate(new Date().toISOString().split('T')[0]);
                    setHistoryPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    setHistoryStartDate(firstDay);
                    setHistoryEndDate(now.toISOString().split('T')[0]);
                    setHistoryPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                >
                  Este mes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setHistoryPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                >
                  Todas las fechas
                </button>
              </div>

              {(historySearch || historyStartDate || historyEndDate || historyStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setHistoryStatus('all');
                    setHistoryPage(1);
                  }}
                  className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Table / List */}
          {loadingHistoryList ? (
            <div className="py-20 flex justify-center"><FootballSpinner /></div>
          ) : (historyData?.data || []).length === 0 ? (
            <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">No se encontraron recargas ni vouchers</p>
              <p className="text-slate-500 text-sm mt-1">Prueba cambiando el rango de fechas o los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                        <th className="py-3.5 px-4">Fecha y Hora</th>
                        <th className="py-3.5 px-4">Jugador</th>
                        <th className="py-3.5 px-4 text-right">Monto</th>
                        <th className="py-3.5 px-4 text-center">Voucher / Comprobante</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {historyData?.data.map((tx) => {
                        const numAmount = parseFloat(tx.amount || '0');
                        const dateStr = new Date(tx.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span>{dateStr}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-white">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                  {tx.user?.avatar ? (
                                    <img src={tx.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="block truncate leading-tight font-bold text-white">
                                      {tx.user?.name || 'Desconocido'}
                                    </span>
                                    {tx.user?.name && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(tx.user!.name, 'Nombre')}
                                        className="text-slate-500 hover:text-lime-400 p-0.5 rounded transition-colors"
                                        title="Copiar nombre del jugador"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                    {tx.user?.nickname && (
                                      <span className="text-primary font-medium truncate">
                                        "{tx.user.nickname}"
                                      </span>
                                    )}
                                    {tx.user?.phone && (
                                      <span className="font-mono text-slate-500">📱 {tx.user.phone}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-black text-base text-lime-400">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>S/ {numAmount.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(numAmount.toFixed(2), 'Monto')}
                                  className="text-slate-500 hover:text-lime-400 p-0.5 rounded transition-colors"
                                  title="Copiar monto"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {tx.receipt_path ? (
                                <button
                                  onClick={() => setSelectedReceipt({
                                    url: tx.receipt_path!,
                                    playerName: tx.user?.name,
                                    amount: tx.amount
                                  })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-sm group"
                                  title="Ver voucher a pantalla completa"
                                >
                                  <Eye className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                                  <span>Ver Voucher</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Sin comprobante</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {tx.status === 'aprobado' && (
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Aprobado
                                  </span>
                                  {tx.approver_name && (
                                    <span className="text-[10px] text-slate-500 mt-0.5">
                                      por {tx.approver_name}
                                    </span>
                                  )}
                                </div>
                              )}
                              {tx.status === 'pendiente' && (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center justify-center gap-1">
                                  <Clock className="h-3 w-3" /> Pendiente
                                </span>
                              )}
                              {tx.status === 'rechazado' && (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center gap-1">
                                  <X className="h-3 w-3" /> Rechazado
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {tx.status === 'pendiente' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => approveMutation.mutate(tx.id)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors"
                                    title="Aprobar recarga"
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() => rejectMutation.mutate(tx.id)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold px-2.5 py-1 rounded-lg text-xs transition-colors border border-red-500/30"
                                    title="Rechazar recarga"
                                  >
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(`${tx.user?.name || 'Jugador'} - S/ ${numAmount.toFixed(2)}`, 'Nombre y monto')}
                                    className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition-colors"
                                    title="Copiar nombre y monto para verificar en Yape"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => tx.receipt_path && setSelectedReceipt({
                                      url: tx.receipt_path,
                                      playerName: tx.user?.name,
                                      amount: tx.amount
                                    })}
                                    disabled={!tx.receipt_path}
                                    className="text-xs text-slate-400 hover:text-white font-bold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                                    title="Ver comprobante"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Revisar
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(`${tx.user?.name || 'Jugador'} - S/ ${numAmount.toFixed(2)}`, 'Nombre y monto')}
                                    className="text-slate-400 hover:text-lime-400 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors border border-slate-700/60"
                                    title="Copiar nombre y monto para verificar en Yape"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {historyData && historyData.meta.last_page > 1 && (
                <div className="pt-2">
                  <Pagination
                    currentPage={historyData.meta.current_page}
                    lastPage={historyData.meta.last_page}
                    onPageChange={(p) => setHistoryPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PLAYER MOVEMENTS / HISTORY MODAL */}
      {historyModalUser && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setHistoryModalUser(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1">
                  <History className="h-3.5 w-3.5" /> Historial de Movimientos
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {playerHistoryData?.user?.name || historyModalUser.name}
                </h3>
                {playerHistoryData?.user?.phone && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    📱 {playerHistoryData.user.phone} {playerHistoryData.user.dni ? `| DNI: ${playerHistoryData.user.dni}` : ''}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Actual</p>
                <p className="text-2xl font-black text-lime-400">
                  S/ {parseFloat(playerHistoryData?.user?.balance || historyModalUser.balance || '0').toFixed(2)}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto py-4 space-y-3 flex-grow">
              {loadingHistory ? (
                <div className="py-12 flex justify-center"><FootballSpinner /></div>
              ) : !playerHistoryData?.transactions?.length ? (
                <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                  <FileText className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-bold text-sm">Sin movimientos registrados</p>
                  <p className="text-slate-600 text-xs mt-1">Este jugador aún no tiene recargas, pagos ni ajustes de saldo.</p>
                </div>
              ) : (
                playerHistoryData.transactions.map((tx) => {
                  const typeInfo = getTypeLabel(tx.type);
                  const numAmount = parseFloat(tx.amount);
                  const isPositive = numAmount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.color} uppercase`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(tx.created_at).toLocaleDateString('es-PE', { 
                              day: '2-digit', month: '2-digit', year: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Motivo / Descripcion */}
                        <p className="text-sm font-bold text-white leading-snug">
                          {tx.description || 'Sin descripcion'}
                        </p>

                        {/* Approver / Admin note */}
                        {tx.approver_name && (
                          <p className="text-[11px] text-slate-400">
                            👤 Operado por: <span className="text-slate-300 font-semibold">{tx.approver_name}</span>
                          </p>
                        )}
                      </div>

                      {/* Right amount and balance after */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60 shrink-0">
                        <div className="flex items-center gap-1.5">
                          {isPositive ? (
                            <ArrowUpCircle className="h-4 w-4 text-lime-400" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`text-lg font-black font-mono ${isPositive ? 'text-lime-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}S/ {numAmount.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Saldo final: S/ {parseFloat(tx.balance_after).toFixed(2)}
                        </span>

                        {tx.receipt_path && (
                          <button
                            onClick={() => setSelectedReceipt({
                              url: tx.receipt_path!,
                              playerName: playerHistoryData?.user?.name || historyModalUser?.name,
                              amount: tx.amount
                            })}
                            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            <Eye className="h-3 w-3" /> Ver comprobante
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <Button
                onClick={() => {
                  const targetUser = historyModalUser;
                  setHistoryModalUser(null);
                  setAdjustModalUser(targetUser);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
              >
                <Sliders className="h-3.5 w-3.5 mr-1 text-primary" /> Nuevo Ajuste
              </Button>
              <Button
                onClick={() => setHistoryModalUser(null)}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs px-6 rounded-xl border-0"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* RECEIPT VIEW MODAL */}
      {selectedReceipt && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}></div>
          <div className="relative bg-slate-900 rounded-3xl p-5 max-w-lg w-full border border-slate-700 shadow-2xl flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <h4 className="text-white font-black text-base uppercase">Comprobante de Pago</h4>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick copy info bar */}
            {(selectedReceipt.playerName || selectedReceipt.amount) && (
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex-1 min-w-0 text-left w-full sm:w-auto">
                  {selectedReceipt.playerName && (
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-xs text-slate-400 font-bold truncate">
                        Jugador: <strong className="text-white">{selectedReceipt.playerName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedReceipt.playerName!, 'Nombre')}
                        className="text-slate-400 hover:text-lime-400 px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                        title="Copiar nombre"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  )}
                  {selectedReceipt.amount && (
                    <div className="flex items-center justify-between sm:justify-start gap-2 mt-1">
                      <span className="text-xs text-slate-400 font-bold">
                        Monto: <strong className="text-lime-400 font-black font-mono">S/ {parseFloat(selectedReceipt.amount).toFixed(2)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(parseFloat(selectedReceipt.amount!).toFixed(2), 'Monto')}
                        className="text-slate-400 hover:text-lime-400 px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                        title="Copiar monto"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  )}
                </div>
                {selectedReceipt.playerName && selectedReceipt.amount && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${selectedReceipt.playerName} - S/ ${parseFloat(selectedReceipt.amount!).toFixed(2)}`, 'Nombre y monto')}
                    className="w-full sm:w-auto px-3 py-1.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30 rounded-xl text-xs font-black transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                    title="Copiar ambos datos para buscar y verificar en Yape o Plin"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Todo</span>
                  </button>
                )}
              </div>
            )}

            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-800 w-full flex justify-center bg-black">
              <img src={selectedReceipt.url} alt="Comprobante" className="max-w-full h-auto object-contain" />
            </div>
            <div className="flex gap-2 w-full mt-4">
              <a
                href={selectedReceipt.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Abrir Original
              </a>
              <Button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 bg-lime-400 text-slate-950 font-black text-xs py-2.5 rounded-xl border-0"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADJUST BALANCE MODAL */}
      {adjustModalUser && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAdjustModalUser(null)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Ajustar Saldo Manual</h3>
            <p className="text-slate-400 text-xs mb-4">
              Jugador: <span className="text-white font-bold">{adjustModalUser.name}</span> | Saldo actual: <span className="text-lime-400 font-bold">S/ {parseFloat(adjustModalUser.balance).toFixed(2)}</span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                adjustMutation.mutate({
                  userId: adjustModalUser.id,
                  amount: adjustAmount,
                  description: adjustDesc
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Monto a Ajustar (S/)
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Usa positivo para sumar (ej. 20 o 50) o negativo para restar (ej. -10)
                </p>
                <Input
                  type="number"
                  step="0.50"
                  required
                  placeholder="Ej: 20.00 o -10.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl mt-1 font-mono text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Motivo / Descripcion del Ajuste
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Escribe por qué aumentas o quitas el saldo (se guardará en el historial del jugador)
                </p>
                <Input
                  type="text"
                  required
                  placeholder="Ej: Pago en efectivo recibido / Correccion / Bono / Multa"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setAdjustModalUser(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border-0"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black rounded-xl border-0"
                >
                  {adjustMutation.isPending ? 'Guardando...' : 'Aplicar Ajuste'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};
