import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, 
  Upload, Plus, Copy, Check, Eye, ExternalLink, Shield, Zap, 
  Sparkles, AlertCircle, RefreshCw, Smartphone, CreditCard, ChevronRight, 
  X, ArrowRight, TrendingUp, History, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import ReactDOM from 'react-dom';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

interface WalletTransaction {
  id: number;
  type: 'recarga' | 'descuento' | 'devolucion' | 'ajuste';
  amount: string;
  balance_after: string;
  description: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  receipt_path: string | null;
  created_at: string;
}

interface WalletData {
  wallet: { id: number; balance: string };
  stats?: {
    total_recharged: number;
    total_spent: number;
    total_refunded: number;
    pending_count: number;
    pending_recharge?: {
      id: number;
      amount: string;
      created_at: string;
      receipt_path: string | null;
    } | null;
  };
  transactions: {
    data: WalletTransaction[];
    current_page: number;
    last_page: number;
  };
}

const QUICK_AMOUNTS = [10, 15, 20, 30, 50, 100];

export const WalletPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recarga' | 'descuento' | 'devolucion' | 'ajuste'>('all');

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('960735653');
    setCopied(true);
    toast.success('¡Número de Yape copiado: 960 735 653!');
    setTimeout(() => setCopied(false), 2500);
  };

  const { data, isLoading, isFetching, refetch } = useQuery<WalletData>({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    }
  });

  const rechargeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/wallet/recharge', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('¡Comprobante enviado! El administrador validará tu recarga en breve.');
      queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallets-pending'] });
      setShowRechargeModal(false);
      setAmount('');
      setReceiptFile(null);
      setReceiptPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al enviar comprobante de recarga');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 10 MB)');
        return;
      }
      setReceiptFile(file);
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
    }
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      toast.error('Ingresa un monto válido (mínimo S/ 1.00)');
      return;
    }
    if (!receiptFile) {
      toast.error('Debes adjuntar la captura del comprobante de pago');
      return;
    }
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('receipt', receiptFile);
    rechargeMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <FootballSpinner />
        <p className="text-slate-400 text-sm font-semibold">Cargando tu billetera digital...</p>
      </div>
    );
  }

  const balance = parseFloat(data?.wallet?.balance || '0');
  const allTransactions = data?.transactions?.data || [];
  const filteredTransactions = activeFilter === 'all'
    ? allTransactions
    : allTransactions.filter(tx => tx.type === activeFilter);

  const pendingRecharge = data?.stats?.pending_recharge || 
    allTransactions.find(tx => tx.type === 'recarga' && tx.status === 'pendiente');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recarga': return <ArrowUpCircle className="h-5 w-5 text-emerald-400" />;
      case 'descuento': return <ArrowDownCircle className="h-5 w-5 text-rose-400" />;
      case 'devolucion': return <ArrowUpCircle className="h-5 w-5 text-blue-400" />;
      case 'ajuste': return <Sparkles className="h-5 w-5 text-purple-400" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recarga': return 'Recarga de Saldo';
      case 'descuento': return 'Pago de Convocatoria';
      case 'devolucion': return 'Devolución de Saldo';
      case 'ajuste': return 'Ajuste de Saldo';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobado': 
        return (
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Aprobado
          </span>
        );
      case 'pendiente': 
        return (
          <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
            <Clock className="h-3 w-3" /> En Revisión
          </span>
        );
      case 'rechazado': 
        return (
          <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rechazado
          </span>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Admin Bridge Banner (If current user is admin) */}
      {user?.role === 'admin' && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Modo Administrador</p>
              <p className="text-sm font-semibold text-white">Esta es tu billetera personal. Puedes ir al panel general para aprobar recargas y gestionar saldos de todos los jugadores.</p>
            </div>
          </div>
          <Link
            to="/admin/billeteras"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-md shadow-indigo-950/50"
          >
            <span>Gestionar Billeteras</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-lime-400" />
            <span>Mi Billetera Digital</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Controla tu saldo para las pichangas, recarga con Yape y revisa tu historial</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
          title="Actualizar saldo"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-lime-400' : 'text-slate-400'}`} />
          <span>{isFetching ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* Pending Recharge Alert Banner (if any) */}
      {pendingRecharge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md shadow-lg"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 animate-pulse">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Recarga en Verificación
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(pendingRecharge.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-1">
                  Tienes una recarga de <span className="text-amber-400 font-black">S/ {parseFloat(pendingRecharge.amount).toFixed(2)}</span> en revisión por el administrador.
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tu comprobante fue recibido. En cuanto sea aprobado por el admin, tu saldo se actualizará automáticamente.
                </p>
              </div>
            </div>

            {pendingRecharge.receipt_path && (
              <Button
                type="button"
                onClick={() => setSelectedReceiptUrl(pendingRecharge.receipt_path)}
                className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold px-3.5 py-2 h-auto rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Mi Voucher</span>
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Digital Membership Card (Fintech Style) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl overflow-hidden group"
      >
        {/* Glow & Patterns */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-lime-400/15 transition-all"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Subtle geometric line pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Card Top: Branding & Chip */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-lime-400/20">
                ⚽
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-lime-400 block">
                  Pichangas de Barrio FC
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Billetera Digital Oficial
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-lime-400/15 text-lime-300 border border-lime-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                {user?.role === 'admin' ? 'Administrador' : 'Socio Activo'}
              </span>
            </div>
          </div>

          {/* Card Middle: Available Balance */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-lime-400" />
                <span>Saldo Disponible para Pichangas</span>
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-400">S/</span>
                <span className={`text-5xl sm:text-6xl font-black tracking-tight ${balance > 0 ? 'text-lime-400 drop-shadow-[0_0_20px_rgba(163,230,53,0.3)]' : balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {balance.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {balance > 0 ? '🟢 Tu saldo está listo para confirmar tu lugar en las convocatorias' : '⚪ Recarga tu billetera para asegurar tu cupo en la cancha'}
              </p>
            </div>

            {/* Quick Actions Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 sm:pt-0">
              <Button
                onClick={() => setShowRechargeModal(true)}
                className="bg-lime-400 hover:bg-lime-500 text-slate-950 font-black px-6 py-3.5 h-auto text-sm rounded-2xl border-0 shadow-lg shadow-lime-400/25 transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                <span>Recargar con Yape</span>
              </Button>
            </div>
          </div>

          {/* Card Bottom: Member Name & Card Identifier */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase">Titular:</span>
              <span className="font-black text-white uppercase tracking-wider">{user?.name || 'Jugador Pichangas'}</span>
              {user?.nickname && (
                <span className="text-lime-400 font-bold">"{user.nickname}"</span>
              )}
            </div>

            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
              <span>ID: PDB-{String(user?.id || 1).padStart(5, '0')}</span>
              {user?.phone && <span>• 📱 {user.phone}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Official Yape / Plin Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/40 rounded-2xl p-5 border border-purple-500/40 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#742284] border border-purple-300/40 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50">
              <span className="text-2xl font-black text-white">Y</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
                  📱 Cuenta Oficial de Recargas
                </span>
                <span className="text-xs text-lime-400 font-bold">Yape / Plin</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Beneficiario Oficial:</p>
              <p className="text-base sm:text-lg font-black text-white tracking-wide">
                MARCO ANTONIO LOPEZ LLANOS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/90 px-4 py-3 rounded-2xl border border-purple-500/40 w-full md:w-auto justify-between md:justify-start shadow-inner">
            <div>
              <p className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Número de Celular Oficial</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider">960 735 653</p>
            </div>
            <button
              type="button"
              onClick={handleCopyNumber}
              className={`ml-2 px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 ${
                copied 
                  ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/30' 
                  : 'bg-purple-600/40 hover:bg-purple-600 text-white border-purple-400/40'
              }`}
              title="Copiar número de Yape"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-purple-200" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3 Step Guide (How it works) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black text-sm shrink-0">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Yapea o Plinea</h4>
            <p className="text-xs text-slate-400 mt-0.5">Envía el monto a <strong className="text-white">960 735 653</strong> (Marco Lopez) y guarda la captura.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/30 flex items-center justify-center font-black text-sm shrink-0">
            2
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sube tu Voucher</h4>
            <p className="text-xs text-slate-400 mt-0.5">Toca el botón <strong className="text-lime-400">"Recargar con Yape"</strong> y adjunta la foto de tu comprobante.</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
            3
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">¡Saldo Acreditado!</h4>
            <p className="text-xs text-slate-400 mt-0.5">El admin valida tu pago y tu saldo se recarga listo para unirte a las pichangas.</p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <History className="h-5 w-5 text-lime-400" />
              <span>Historial de Movimientos</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Registro de todas tus recargas, pagos de partidos y devoluciones</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({allTransactions.length})
            </button>
            <button
              onClick={() => setActiveFilter('recarga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'recarga'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Recargas
            </button>
            <button
              onClick={() => setActiveFilter('descuento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'descuento'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Pagos Pichangas
            </button>
            <button
              onClick={() => setActiveFilter('devolucion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'devolucion'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                  : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              Devoluciones
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <Wallet className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">No hay movimientos registrados</p>
            <p className="text-slate-500 text-xs mt-1">
              {activeFilter === 'all' 
                ? 'Recarga tu billetera por primera vez para empezar a pichanguear.' 
                : 'No se encontraron movimientos para el filtro seleccionado.'}
            </p>
            {activeFilter === 'all' && (
              <Button
                onClick={() => setShowRechargeModal(true)}
                className="mt-4 bg-lime-400 hover:bg-lime-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl border-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Hacer mi primera recarga
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const amt = parseFloat(tx.amount || '0');
              const isPositive = amt >= 0;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/90 hover:bg-slate-850 rounded-2xl p-4 border border-slate-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {tx.description || getTypeLabel(tx.type)}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          {new Date(tx.created_at).toLocaleDateString('es-PE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {tx.balance_after && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            • Saldo posterior: S/ {parseFloat(tx.balance_after).toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    {tx.receipt_path && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptUrl(tx.receipt_path)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-slate-700"
                        title="Ver comprobante de pago"
                      >
                        <Eye className="h-3.5 w-3.5 text-lime-400" />
                        <span>Voucher</span>
                      </button>
                    )}

                    <div className="text-right">
                      <span className={`text-base sm:text-lg font-black tracking-tight ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? '+' : ''}S/ {amt.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== RECHARGE MODAL ===== */}
      {showRechargeModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowRechargeModal(false)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl z-10 space-y-5 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Zap className="h-5 w-5 text-lime-400" />
                  <span>Recargar Billetera</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ingresa el monto que yapeaste y adjunta tu comprobante</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRechargeModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Official Yape Mini Box */}
            <div className="bg-gradient-to-r from-purple-950/70 to-purple-900/40 border border-purple-500/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                  📱 Cuenta Oficial Yape
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="bg-purple-600/30 hover:bg-purple-600 text-purple-200 px-2 py-0.5 rounded-lg border border-purple-400/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-lime-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-white tracking-wider">960 735 653</span>
                <span className="text-xs font-black text-lime-400">MARCO ANTONIO LOPEZ</span>
              </div>
            </div>

            <form onSubmit={handleRecharge} className="space-y-4">
              {/* Quick Amount Chips */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Elige un monto rápido o escribe abajo
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {QUICK_AMOUNTS.map((quickVal) => (
                    <button
                      key={quickVal}
                      type="button"
                      onClick={() => setAmount(String(quickVal))}
                      className={`py-2 rounded-xl text-xs font-black transition-all border ${
                        amount === String(quickVal)
                          ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/20'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      S/ {quickVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Monto Exacto en Soles (S/) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">S/</span>
                  <Input
                    type="number"
                    step="0.50"
                    min="1"
                    max="1000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-800 border-slate-700 text-white pl-10 h-12 text-lg font-black rounded-xl focus:border-lime-400"
                  />
                </div>
              </div>

              {/* Voucher upload with live preview */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Captura del Comprobante (Voucher) <span className="text-rose-400">*</span>
                </label>
                
                {receiptPreview ? (
                  <div className="relative bg-slate-950 rounded-2xl p-3 border border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        <img src={receiptPreview} alt="Preview voucher" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{receiptFile?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {receiptFile ? (receiptFile.size / 1024).toFixed(0) + ' KB' : ''} • Listo para enviar
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors"
                      title="Quitar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-lime-400/60 rounded-2xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition-all group">
                    <div className="p-3 rounded-full bg-slate-900 group-hover:bg-lime-400/10 text-slate-400 group-hover:text-lime-400 transition-colors mb-2">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-sm text-slate-200 font-bold text-center">
                      Toca aquí para subir la foto del voucher
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      Formatos JPG, PNG o WebP (máximo 10 MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 rounded-xl border-0"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={rechargeMutation.isPending || !amount || !receiptFile}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-950 font-black h-12 rounded-xl border-0 shadow-lg shadow-lime-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rechargeMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* ===== VOUCHER PREVIEW MODAL ===== */}
      {selectedReceiptUrl && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedReceiptUrl(null)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-lg w-full z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Comprobante de Pago</span>
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 max-h-[70vh] flex items-center justify-center">
              <img src={selectedReceiptUrl} alt="Comprobante" className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="pt-3 flex justify-end">
              <a
                href={selectedReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-lime-400 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Abrir en tamaño completo</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
