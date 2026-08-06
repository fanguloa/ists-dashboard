import { X, Key, Eye, EyeOff, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface CredentialAccount {
  id: string;
  label: string;
  type: 'userpass' | 'sso' | 'none';
  username?: string;
  password?: string;
  ssoProvider?: string;
  ssoUrl?: string;
}

interface Instance {
  id: number;
  environment: string;
  layer: string;
  namespace: string | null;
  authType?: string | null;
  username?: string | null;
  password?: string | null;
  credentials?: string | CredentialAccount[] | null;
  ssoProvider?: string | null;
  ssoUrl?: string | null;
}

interface EditCredentialsModalProps {
  instance: Instance;
  onClose: () => void;
  onSave: (updated: Partial<Instance>) => Promise<void>;
}

const ssoProviders = [
  { value: 'azure', label: 'Microsoft Azure AD' },
  { value: 'okta', label: 'Okta' },
  { value: 'saml', label: 'SAML Generic' },
  { value: 'oauth', label: 'OAuth 2.0' },
];

function loadInitialAccounts(instance: Instance): CredentialAccount[] {
  if (instance.credentials) {
    try {
      const parsed = typeof instance.credentials === 'string'
        ? JSON.parse(instance.credentials)
        : instance.credentials;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `acc-${Date.now()}-${idx}`,
          label: item.label || (idx === 0 ? 'Principal' : `Credencial ${idx + 1}`),
          type: item.type || 'userpass',
          username: item.username || '',
          password: item.password || '',
          ssoProvider: item.ssoProvider || '',
          ssoUrl: item.ssoUrl || '',
        }));
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback a credenciales heredadas
  if (instance.authType === 'sso') {
    return [
      {
        id: `acc-${Date.now()}`,
        label: 'Acceso SSO',
        type: 'sso',
        ssoProvider: instance.ssoProvider || 'azure',
        ssoUrl: instance.ssoUrl || '',
      },
    ];
  }

  if (instance.authType === 'none') {
    return [
      {
        id: `acc-${Date.now()}`,
        label: 'Sin Autenticación',
        type: 'none',
      },
    ];
  }

  return [
    {
      id: `acc-${Date.now()}`,
      label: '_SYSTEM / Admin',
      type: 'userpass',
      username: instance.username || '_SYSTEM',
      password: instance.password || 'SYS',
    },
  ];
}

export function EditCredentialsModal({ instance, onClose, onSave }: EditCredentialsModalProps) {
  const [accounts, setAccounts] = useState<CredentialAccount[]>(() => loadInitialAccounts(instance));
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (key: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error('Error copiando al portapapeles:', e);
    }
  };

  const handleAccountChange = (id: string, field: keyof CredentialAccount, value: any) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleAddAccount = (type: 'userpass' | 'sso' | 'none' = 'userpass') => {
    const labels: Record<string, string> = {
      userpass: 'Usuario / Pass',
      sso: 'Acceso SSO',
      none: 'Acceso Directo (Sin Auth)',
    };

    const newAccount: CredentialAccount = {
      id: `acc-${Date.now()}-${accounts.length}`,
      label: `${labels[type]} ${accounts.length + 1}`,
      type,
      username: type === 'userpass' ? '_SYSTEM' : '',
      password: type === 'userpass' ? 'SYS' : '',
      ssoProvider: type === 'sso' ? 'azure' : '',
      ssoUrl: '',
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const handleRemoveAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const firstUserPass = accounts.find((a) => a.type === 'userpass');
      const firstSSO = accounts.find((a) => a.type === 'sso');
      const primaryType = accounts[0]?.type || 'userpass';

      await onSave({
        authType: primaryType,
        username: firstUserPass?.username || null,
        password: firstUserPass?.password || null,
        ssoProvider: firstSSO?.ssoProvider || null,
        ssoUrl: firstSSO?.ssoUrl || null,
        credentials: accounts,
      });
      onClose();
    } catch (error) {
      console.error('Error guardando credenciales:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Credenciales del Link
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {instance.environment} · {instance.layer} {instance.namespace && `· ${instance.namespace}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Credenciales asociadas ({accounts.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddAccount('userpass')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                + Basic/UserPass
              </button>
              <button
                type="button"
                onClick={() => handleAddAccount('sso')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                + SSO
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 relative group"
              >
                {/* Header de la credencial */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={account.label}
                      onChange={(e) => handleAccountChange(account.id, 'label', e.target.value)}
                      placeholder="Ej: _SYSTEM, Admin, Médico Demo"
                      className="text-xs font-semibold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 text-slate-800 dark:text-slate-200 focus:outline-none py-0.5"
                    />
                  </div>

                  {/* Selector de Tipo */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleAccountChange(account.id, 'type', 'userpass')}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                        account.type === 'userpass'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Basic
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccountChange(account.id, 'type', 'sso')}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                        account.type === 'sso'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      SSO
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccountChange(account.id, 'type', 'none')}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                        account.type === 'none'
                          ? 'bg-slate-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Sin Auth
                    </button>
                  </div>

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(account.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar credencial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Campos según tipo */}
                {account.type === 'userpass' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Usuario */}
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Usuario
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={account.username || ''}
                          onChange={(e) => handleAccountChange(account.id, 'username', e.target.value)}
                          placeholder="_SYSTEM"
                          className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                        {account.username && (
                          <button
                            type="button"
                            onClick={() => handleCopy(`user-${account.id}`, account.username || '')}
                            className="absolute right-2 text-slate-400 hover:text-blue-500"
                            title="Copiar usuario"
                          >
                            {copiedKey === `user-${account.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Contraseña
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={visiblePasswords[account.id] ? 'text' : 'password'}
                          value={account.password || ''}
                          onChange={(e) => handleAccountChange(account.id, 'password', e.target.value)}
                          placeholder="SYS"
                          className="w-full px-2.5 py-1.5 pr-14 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                        <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                          {account.password && (
                            <button
                              type="button"
                              onClick={() => handleCopy(`pass-${account.id}`, account.password || '')}
                              className="hover:text-blue-500 p-0.5"
                              title="Copiar contraseña"
                            >
                              {copiedKey === `pass-${account.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(account.id)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title={visiblePasswords[account.id] ? 'Ocultar' : 'Mostrar'}
                          >
                            {visiblePasswords[account.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {account.type === 'sso' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        Proveedor SSO
                      </label>
                      <select
                        value={account.ssoProvider || 'azure'}
                        onChange={(e) => handleAccountChange(account.id, 'ssoProvider', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
                      >
                        {ssoProviders.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        URL SSO (opcional)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={account.ssoUrl || ''}
                          onChange={(e) => handleAccountChange(account.id, 'ssoUrl', e.target.value)}
                          placeholder="https://login.microsoftonline.com/..."
                          className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                        {account.ssoUrl && (
                          <a
                            href={account.ssoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 text-slate-400 hover:text-purple-500"
                            title="Abrir URL SSO"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {account.type === 'none' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Acceso público / sin requerimiento de autenticación para esta credencial.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar Credenciales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
