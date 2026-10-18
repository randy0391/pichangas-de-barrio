import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if error is due to chunk / module loading failure from a new deployment
    const isChunkError = 
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('module script');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_error_boundary_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('chunk_error_boundary_reload', now.toString());
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.message?.includes('module script');

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {isChunkError ? 'Nueva versión disponible' : 'Algo salió mal'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isChunkError 
                  ? 'Se acaba de publicar una actualización en el sistema. Presiona el botón para cargar los cambios.' 
                  : 'Ocurrió un problema inesperado al cargar esta sección.'}
              </p>
            </div>

            <Button
              onClick={this.handleReload}
              className="w-full h-12 bg-primary text-slate-950 font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Actualizar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
