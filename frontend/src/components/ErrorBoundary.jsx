import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ledger ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetHome = () => {
    try {
      localStorage.removeItem('nirob_pinned_funds');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070d18] text-white flex items-center justify-center p-4">
          <div className="bg-[#0e1626] border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Something went wrong</h2>
              <p className="text-xs text-slate-300">
                The application encountered an unexpected issue. You can safely reload the page or return to the home dashboard.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800 text-left">
                <p className="font-mono text-[11px] text-rose-400 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetHome}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Home Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
