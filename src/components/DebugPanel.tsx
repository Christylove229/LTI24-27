import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DebugPanel: React.FC = () => {
  const { user, profile, loading, session, refreshProfile, clearLoading, adoptProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<string>('');
  const [testBody, setTestBody] = useState<any>(null);

  const env = {
    URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    ANON: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
    VITE_ADMIN_ROUTE: import.meta.env.VITE_ADMIN_ROUTE || 'hidden-admin-dashboard-xyz789',
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#111827',
          color: 'white',
          fontSize: 12,
          opacity: 0.8,
        }}
      >
        {open ? 'Fermer diagnostique' : 'Ouvrir diagnostique'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            width: 340,
            maxHeight: 420,
            overflow: 'auto',
            background: '#1f2937',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Debug Panel</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            <div><strong>Auth.loading:</strong> {String(loading)}</div>
            <div><strong>User present:</strong> {Boolean(user) ? 'yes' : 'no'}</div>
            <div><strong>User id:</strong> {user?.id || '-'}</div>
            <div><strong>Session present:</strong> {Boolean(session) ? 'yes' : 'no'}</div>
            <div><strong>Profile present:</strong> {Boolean(profile) ? 'yes' : 'no'}</div>
            <hr style={{ borderColor: '#374151', margin: '8px 0' }} />
            <div><strong>Env.VITE_SUPABASE_URL:</strong> {env.URL ? env.URL : 'not set'}</div>
            <div><strong>Env.VITE_SUPABASE_ANON_KEY:</strong> {env.ANON ? `set (len=${env.ANON.length})` : 'not set'}</div>
            <div><strong>Env.VITE_ADMIN_ROUTE:</strong> {String(env.VITE_ADMIN_ROUTE)}</div>
            <div><strong>Mode:</strong> {env.MODE} (DEV:{String(env.DEV)} PROD:{String(env.PROD)})</div>
            <hr style={{ borderColor: '#374151', margin: '8px 0' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (!user) return;
                  setTestStatus('Testing...');
                  setTestBody(null);
                  const { data, error, status } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();
                  setTestStatus(`GET profiles status=${status}${error ? ` code=${(error as any)?.code}` : ''}`);
                  setTestBody(error ? (error as any) : data);
                }}
                style={{ padding: '6px 8px', background: '#0ea5e9', borderRadius: 6 }}
              >Tester profil</button>
              <button
                onClick={() => refreshProfile()}
                style={{ padding: '6px 8px', background: '#22c55e', borderRadius: 6 }}
              >Rafraîchir profil</button>
              <button
                onClick={() => clearLoading()}
                style={{ padding: '6px 8px', background: '#f59e0b', borderRadius: 6 }}
              >Forcer fin chargement</button>
              <button
                onClick={async () => {
                  if (!user || !env.URL || !env.ANON || !session) return;
                  setTestStatus('REST Testing...');
                  setTestBody(null);
                  const controller = new AbortController();
                  const t = setTimeout(() => controller.abort(), 6000);
                  try {
                    const url = `${env.URL}/rest/v1/profiles?id=eq.${user.id}&select=*`;
                    const res = await fetch(url, {
                      method: 'GET',
                      headers: {
                        'apikey': env.ANON,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Accept': 'application/json',
                      },
                      signal: controller.signal,
                    });
                    const text = await res.text();
                    let body: any = text;
                    try { body = JSON.parse(text); } catch {}
                    setTestStatus(`REST GET profiles status=${res.status}`);
                    setTestBody(body);
                  } catch (e: any) {
                    setTestStatus(`REST error: ${e?.name || 'Error'}`);
                    setTestBody({ message: e?.message || String(e) });
                  } finally {
                    clearTimeout(t);
                  }
                }}
                style={{ padding: '6px 8px', background: '#6366f1', borderRadius: 6 }}
              >Tester via REST</button>
              <button
                onClick={() => {
                  if (testBody && testBody.id) {
                    adoptProfile(testBody);
                  }
                }}
                style={{ padding: '6px 8px', background: '#0d9488', borderRadius: 6 }}
              >Adopter profil</button>
            </div>
            {testStatus && (
              <div style={{ marginTop: 8 }}>
                <div><strong>Test:</strong> {testStatus}</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#111827', padding: 8, borderRadius: 6 }}>
{JSON.stringify(testBody, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
