import { X, Plus, Server } from 'lucide-react';
import { useState } from 'react';

interface AddEnvironmentModalProps {
  clientId: number;
  clientCode: string;
  existingEnvs: string[];
  onClose: () => void;
  onCreated: () => void;
}

const COMMON_ENVS = ['DEV', 'TEST', 'PREPROD', 'SCRATCH', 'DEMO', 'PROD'];

export function AddEnvironmentModal({
  clientId,
  clientCode,
  existingEnvs,
  onClose,
  onCreated,
}: AddEnvironmentModalProps) {
  const [selectedPreset, setSelectedEnvPreset] = useState('DEV');
  const [customEnv, setCustomEnv] = useState('');
  const [layer, setLayer] = useState<'trakcare' | 'integration' | 'smp'>('trakcare');
  const [namespace, setNamespace] = useState('');
  const [creating, setCreating] = useState(false);

  const envName = (selectedPreset === 'CUSTOM' ? customEnv : selectedPreset).toUpperCase().trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envName) return;

    setCreating(true);
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          environment: envName,
          layer,
          namespace: namespace.trim() || `${envName}-${clientCode}`,
        }),
      });

      if (response.ok) {
        onCreated();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Error creando ambiente');
      }
    } catch (err) {
      console.error('Error creando ambiente:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Nuevo Ambiente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proyecto {clientCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre del ambiente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del Ambiente
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {COMMON_ENVS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedEnvPreset(preset)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    selectedPreset === preset
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedEnvPreset('CUSTOM')}
                className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium transition-all col-span-3 ${
                  selectedPreset === 'CUSTOM'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Otro (Personalizado)
              </button>
            </div>

            {selectedPreset === 'CUSTOM' && (
              <input
                type="text"
                value={customEnv}
                onChange={(e) => setCustomEnv(e.target.value.toUpperCase())}
                placeholder="Ej: QA, TEST2, MIGRATION"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-mono uppercase"
                required
              />
            )}
          </div>

          {/* Capa Inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Capa Inicial
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setLayer('trakcare')}
                className={`px-2.5 py-2 text-xs rounded-lg border font-medium transition-all flex flex-col items-center gap-1 ${
                  layer === 'trakcare'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>🌐 TrakCare</span>
              </button>
              <button
                type="button"
                onClick={() => setLayer('integration')}
                className={`px-2.5 py-2 text-xs rounded-lg border font-medium transition-all flex flex-col items-center gap-1 ${
                  layer === 'integration'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>⚡ Integration</span>
              </button>
              <button
                type="button"
                onClick={() => setLayer('smp')}
                className={`px-2.5 py-2 text-xs rounded-lg border font-medium transition-all flex flex-col items-center gap-1 ${
                  layer === 'smp'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>📦 SMP Portal</span>
              </button>
            </div>
          </div>

          {/* Namespace */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Namespace
            </label>
            <input
              type="text"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value.toUpperCase())}
              placeholder={`${envName || 'ENV'}-${clientCode}`}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-mono uppercase"
            />
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
              disabled={creating || !envName}
              className="flex-1 px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
            >
              {creating ? 'Creando...' : 'Crear Ambiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
