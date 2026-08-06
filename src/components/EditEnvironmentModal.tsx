import { X, Server, Settings, Check } from 'lucide-react';
import { useState } from 'react';

interface EditEnvironmentModalProps {
  clientId: number;
  clientCode: string;
  environment: string;
  initialData: {
    hasHA: boolean;
    gatewayUrl: string;
    node1Url: string;
    node2Url: string;
    node1Role: string;
    node2Role: string;
    smpPath: string;
    trakcarePath: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function EditEnvironmentModal({
  clientId,
  clientCode,
  environment,
  initialData,
  onClose,
  onSaved,
}: EditEnvironmentModalProps) {
  const [formData, setFormData] = useState({
    hasHA: initialData.hasHA,
    gatewayUrl: initialData.gatewayUrl || '',
    node1Url: initialData.node1Url || '',
    node2Url: initialData.node2Url || '',
    node1Role: initialData.node1Role || 'primary',
    node2Role: initialData.node2Role || 'backup',
    smpPath: initialData.smpPath || '/csp/sys/%25CSP.Portal.Home.zen',
    trakcarePath: initialData.trakcarePath || '/csp/system.Home.cls',
  });
  const [saving, setSaving] = useState(false);

  const normalizeToHttps = (url: string): string => {
    if (!url) return url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/environments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          environment,
          hasHA: formData.hasHA,
          gatewayUrl: formData.gatewayUrl ? normalizeToHttps(formData.gatewayUrl) : '',
          node1Url: formData.node1Url ? normalizeToHttps(formData.node1Url) : '',
          node2Url: formData.node2Url ? normalizeToHttps(formData.node2Url) : '',
          node1Role: formData.node1Role,
          node2Role: formData.node2Role,
          smpPath: formData.smpPath,
          trakcarePath: formData.trakcarePath,
        }),
      });

      if (response.ok) {
        onSaved();
        onClose();
      } else {
        alert('Error actualizando ambiente');
      }
    } catch (err) {
      console.error('Error guardando ambiente:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Configurar Ambiente: {environment}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplica a todas las capas del ambiente (Clínica e Integraciones) en {clientCode}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Alta Disponibilidad Toggle */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <label htmlFor="envHasHA" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Alta Disponibilidad (HA)
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Habilita arquitectura con VIP Gateway y 2 Nodos (Primario / Backup)
              </p>
            </div>
            <input
              type="checkbox"
              id="envHasHA"
              checked={formData.hasHA}
              onChange={(e) => setFormData({ ...formData, hasHA: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Gateway / VIP URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              URL del Gateway / VIP {formData.hasHA && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              value={formData.gatewayUrl}
              onChange={(e) => setFormData({ ...formData, gatewayUrl: e.target.value })}
              placeholder="https://10.244.20.6"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dirección Virtual IP / Balanceador para acceder a la aplicación
            </p>
          </div>

          {/* Nodos HA */}
          {formData.hasHA && (
            <div className="space-y-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                Configuración de Nodos
              </h3>

              {/* Nodo 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Nodo 1 URL
                  </label>
                  <input
                    type="url"
                    value={formData.node1Url}
                    onChange={(e) => setFormData({ ...formData, node1Url: e.target.value })}
                    placeholder="https://10.244.20.4"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Rol Nodo 1
                  </label>
                  <select
                    value={formData.node1Role}
                    onChange={(e) => setFormData({ ...formData, node1Role: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="primary">🟢 Primario</option>
                    <option value="backup">⚪ Backup</option>
                  </select>
                </div>
              </div>

              {/* Nodo 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Nodo 2 URL
                  </label>
                  <input
                    type="url"
                    value={formData.node2Url}
                    onChange={(e) => setFormData({ ...formData, node2Url: e.target.value })}
                    placeholder="https://10.244.20.5"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Rol Nodo 2
                  </label>
                  <select
                    value={formData.node2Role}
                    onChange={(e) => setFormData({ ...formData, node2Role: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="primary">🟢 Primario</option>
                    <option value="backup">⚪ Backup</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Paths por defecto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Path SMP (Portal IRIS)
              </label>
              <input
                type="text"
                value={formData.smpPath}
                onChange={(e) => setFormData({ ...formData, smpPath: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Path TrakCare (UI Clínica)
              </label>
              <input
                type="text"
                value={formData.trakcarePath}
                onChange={(e) => setFormData({ ...formData, trakcarePath: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
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
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
