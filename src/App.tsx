import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Repositories } from './pages/Repositories';
import { RepoDetails } from './pages/RepoDetails';
import { Groups } from './pages/Groups';
import { Analytics } from './pages/Analytics';
import { Spinner } from './components/ui/Spinner';
import { Button } from './components/ui/Button';
import { api } from './services/api';

type BootState = 'booting' | 'ready' | 'error';

function BackendSplash({
  elapsedSeconds,
  error,
  onRetry,
}: {
  elapsedSeconds: number;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0b121e] text-slate-200 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-8%] left-[-10%] w-[34rem] h-[34rem] rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="absolute bottom-[-18%] right-[-8%] w-[30rem] h-[30rem] rounded-full bg-teal-400/10 blur-[120px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-[28px] border border-slate-800/80 bg-slate-950/70 backdrop-blur-xl shadow-[0_30px_120px_rgba(2,6,23,0.8)] p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-teal-400 p-[1px] shadow-[0_0_30px_rgba(14,165,233,0.25)]">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                <div className="w-7 h-7 rounded-lg border border-sky-400/40 bg-sky-400/10" />
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-sky-400 font-semibold">GitHub Dashboard</p>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1">Waking the backend</h1>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-4">
              <Spinner size={34} className="shrink-0" />
              <div>
                <p className="text-base font-semibold text-slate-100">Render is starting your API service.</p>
                <p className="text-sm text-slate-400 mt-1">
                  Free-tier cold starts can take a bit. The app will open automatically as soon as the backend responds.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Connection status</span>
                <span>{elapsedSeconds}s elapsed</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 animate-pulse"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <p className="text-sm text-rose-200">{error}</p>
                <Button onClick={onRetry} className="mt-4">
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [bootState, setBootState] = useState<BootState>('booting');
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (bootState === 'ready') {
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [bootAttempt, bootState]);

  useEffect(() => {
    if (bootState === 'ready') {
      return;
    }

    let cancelled = false;
    let retryTimeout: number | undefined;

    const pollBackend = async () => {
      try {
        await api.pingBackend();

        if (!cancelled) {
          setBootError(null);
          setBootState('ready');
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBootState('booting');
        setBootError('Still waiting for the backend to wake up. This usually resolves on its own.');
        retryTimeout = window.setTimeout(pollBackend, 3000);
      }
    };

    setElapsedSeconds(0);
    setBootError(null);
    setBootState('booting');
    pollBackend();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [bootAttempt]);

  if (bootState !== 'ready') {
    return (
      <BackendSplash
        elapsedSeconds={elapsedSeconds}
        error={elapsedSeconds >= 10 ? bootError : null}
        onRetry={() => {
          setElapsedSeconds(0);
          setBootAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="repos" element={<Repositories />} />
          <Route path="repo/:owner/:repoName" element={<RepoDetails />} />
          <Route path="groups" element={<Groups />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
