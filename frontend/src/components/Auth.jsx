import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { LogIn, ShieldCheck } from 'lucide-react';

const Auth = () => {
  const { isSetupComplete, checkSetup, login, setup } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!isSetupComplete) {
        const res = await setup(password);
        if (!res.success) setError(res.message || 'Setup failed');
      } else {
        const res = await login(password);
        if (!res.success) setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-3xl p-8 border border-border shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            {isSetupComplete ? <LogIn size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSetupComplete ? 'Welcome Back' : 'Create Master Password'}
          </h1>
          <p className="text-secondary-foreground text-sm mt-2 text-center">
            {isSetupComplete 
              ? 'Enter your password to access your expense ledger.' 
              : 'Set up your master password to secure your expense ledger.'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-secondary-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSetupComplete ? 'Login' : 'Create & Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
