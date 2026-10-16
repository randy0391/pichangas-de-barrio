import { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, Upload, Plus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FootballSpinner } from '@/components/ui/FootballSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import ReactDOM from 'react-dom';

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
  transactions: {
    data: WalletTransaction[];
    current_page: number;
    last_page: number;
  };
}

export const WalletPage = () => {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('960735653');
    setCopied(true);
    toast.success('Numero de Yape copiado: 960735653');
    setTimeout(() => setCopied(false), 2000);
  };

  const { data, isLoading } = useQuery<WalletData>({
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
      toast.success('Solicitud de recarga enviada. El admin la revisara pronto.');
      queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      setShowRechargeModal(false);
      setAmount('');
      setReceiptFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al enviar recarga');
    }
  });

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      toast.error('Debes subir el comprobante de pago');
      return;
    }
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('receipt', receiptFile);
    rechargeMutation.mutate(formData);
  };

  if (isLoading) return <div className="py-20 flex justify-center"><FootballSpinner /></div>;

  const balance = parseFloat(data?.wallet?.balance || '0');
  const transactions = data?.transactions?.data || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recarga': return <ArrowUpCircle className="h-5 w-5 text-green-400" />;
      case 'descuento': return <ArrowDownCircle className="h-5 w-5 text-red-400" />;
      case 'devolucion': return <ArrowUpCircle className="h-5 w-5 text-blue-400" />;
      case 'ajuste': return <ArrowUpCircle className="h-5 w-5 text-yellow-400" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobado': return <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase">Aprobado</span>;
      case 'pendiente': return <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase">Pendiente</span>;
      case 'rechazado': return <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full uppercase">Rechazado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Billetera</h1>
        <p className="text-slate-400 mt-1">Gestiona tu saldo para las pichangas</p>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-lime-400/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Saldo Disponible</p>
              <p className="text-5xl font-black text-white">
                S/ <span className={balance > 0 ? 'text-lime-400' : 'text-white'}>{balance.toFixed(2)}</span>
              </p>
            </div>
            <div className="bg-lime-400/10 p-4 rounded-2xl">
              <Wallet className="h-10 w-10 text-lime-400" />
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={() => setShowRechargeModal(true)}
              className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold px-6 py-3 rounded-xl border-0"
            >
              <Plus className="h-4 w-4 mr-2" /> Recargar Billetera
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Datos oficiales de Yape / Plin */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-950/70 via-purple-900/40 to-slate-900 rounded-2xl p-5 border border-purple-500/40 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#742284]/40 border border-purple-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-2xl font-black text-purple-300">Y</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  📱 Yape / Plin Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">A nombre de:</p>
              <p className="text-base font-black text-white tracking-wide">
                MARCO ANTONIO LOPEZ LLANOS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-purple-500/40 w-full md:w-auto justify-between md:justify-start shadow-md">
            <div>
              <p className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Número de Yape</p>
              <p className="text-2xl font-black font-mono text-white tracking-wider">960 735 653</p>
            </div>
            <button
              type="button"
              onClick={handleCopyNumber}
              className="ml-2 bg-purple-600/30 hover:bg-purple-600 text-white p-2.5 rounded-xl border border-purple-400/30 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
              title="Copiar número"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-lime-400" />
                  <span className="text-lime-400 font-bold hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-purple-200" />
                  <span className="text-purple-200 font-bold hidden sm:inline">Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Cómo funciona</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start space-x-3">
            <span className="text-lg font-bold text-purple-400">1.</span>
            <p className="text-sm text-slate-400">
              Yapea al <strong className="text-white font-mono">960 735 653</strong> a nombre de <strong className="text-white">Marco Lopez</strong>
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-lg font-bold text-purple-400">2.</span>
            <p className="text-sm text-slate-400">Presiona "Recargar Billetera" y sube tu comprobante</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-lg font-bold text-purple-400">3.</span>
            <p className="text-sm text-slate-400">El admin aprueba tu recarga y tu saldo se acredita</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Historial de Movimientos</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <Wallet className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay movimientos aun</p>
            <p className="text-slate-600 text-sm mt-1">Recarga tu billetera para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(tx.type)}
                  <div>
                    <p className="text-sm font-bold text-white">{tx.description || tx.type}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(tx.status)}
                  <span className={`text-lg font-black ${parseFloat(tx.amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(tx.amount) >= 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRechargeModal(false)}></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl"
          >
            <h3 className="text-xl font-black text-white uppercase mb-4">Recargar Billetera</h3>
            
            {/* Yape/Plin info */}
            <div className="bg-gradient-to-r from-purple-950/70 to-purple-900/40 border border-purple-500/40 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                  📱 Datos para Yapear
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="bg-purple-600/30 hover:bg-purple-600 text-purple-200 px-2.5 py-1 rounded-lg border border-purple-400/30 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? '¡Copiado!' : 'Copiar Número'}
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Número Yape:</span>
                  <span className="text-xl font-black font-mono text-white tracking-wider">960 735 653</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">A nombre de:</span>
                  <span className="text-xs sm:text-sm font-black text-lime-400 text-right">MARCO ANTONIO LOPEZ LLANOS</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monto (S/)</label>
                <Input
                  type="number"
                  step="0.50"
                  min="1"
                  max="500"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej: 50.00"
                  className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Comprobante de pago</label>
                <div className="mt-1">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-400 font-medium">
                      {receiptFile ? receiptFile.name : 'Subir imagen del voucher'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border-0 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={rechargeMutation.isPending}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold border-0 rounded-xl"
                >
                  {rechargeMutation.isPending ? 'Enviando...' : 'Enviar Solicitud'}
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
