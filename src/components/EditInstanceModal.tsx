import { X } from 'lucide-react';
import { useState } from 'react';

interface Instance {
  id: number;
  environment: string;
  layer: string;
  hasHA: boolean;
  gatewayUrl: string | null;
  node1Url: string | null;
  node2Url: string | null;
  node1Role?: string | null;
  node2Role?: string | null;
  smpPath: string | null;
  trakcarePath: string | null;
  namespace: string | null;
}

interface EditInstanceModalProps {
  instance: Instance;
  onClose: () => void;
  onSave: (updated: Partial<Instance>) => Promise<void>;
}

export function EditInstanceModal({ instance, onClose, onSave }: EditInstanceModalProps) {
  const [formData, setFormData] = useState({
    hasHA: instance.hasHA,
    gatewayUrl: instance.gatewayUrl || '',
    node1Url: instance.node1Url || '',
    node2Url: instance.node2Url || '',
    node1Role: instance.node1Role || 'primary',
    node2Role: instance.node2Role || 'backup',
    smpPath: instance.smpPath || '/csp/sys/%25CSP.Portal.Home.zen',
    trakcarePath: instance.trakcarePath || '/csp/system.Home.cls',
  });
  const [saving, setSaving] = useState(false);

  const normalizeToHttps = (url: string): string => {
    if (!url) return url;
    // Si no tiene protocolo, agregar https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    // Si tiene http://, reemplazar por https://
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Normalizar todas las URLs a https://
      const normalizedData = {
        ...formData,
        gatewayUrl: formData.gatewayUrl ? normalizeToHttps(formData.gatewayUrl) : formData.gatewayUrl,
        node1Url: formData.node1Url ? normalizeToHttps(formData.node1Url) : formData.node1Url,
        node2Url: formData.node2Url ? normalizeToHttps(formData.node2Url) : formData.node2Url,
      };
      await onSave(normalizedData);
      onClose();
    } catch (error) {
      console.error('Error guardando instancia:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Configurar Ambiente
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {instance.environment} · {instance.namespace}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alta Disponibilidad */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasHA"
              checked={formData.hasHA}
              onChange={(e) => setFormData({ ...formData, hasHA: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="hasHA" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Alta Disponibilidad (2 nodos IRIS)
            </label>
          </div>

          {/* Gateway URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gateway / Balanceador {formData.hasHA && <span className="text-red-500">*</span>}
            </label>
            <input
              type="url"
              value={formData.gatewayUrl}
              onChange={(e) => setFormData({ ...formData, gatewayUrl: e.target.value })}
              placeholder="https://10.244.20.6"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              URL principal para acceder al ambiente
            </p>
          </div>

          {/* Nodos (solo si HA está activo) */}
          {formData.hasHA && (
            <div className="space-y-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Configuración de Nodos HA
              </h3>

              {/* Nodo 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nodo 1 URL
                  </label>
                  <input
                    type="url"
                    value={formData.node1Url}
                    onChange={(e) => setFormData({ ...formData, node1Url: e.target.value })}
                    placeholder="https://10.244.20.4"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estado Nodo 1
                  </label>
                  <select
                    value={formData.node1Role}
                    onChange={(e) => setFormData({ ...formData, node1Role: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="primary">🟢 Primario</option>
                    <option value="backup">⚪ Backup</option>
                  </select>
                </div>
              </div>

              {/* Nodo 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nodo 2 URL
                  </label>
                  <input
                    type="url"
                    value={formData.node2Url}
                    onChange={(e) => setFormData({ ...formData, node2Url: e.target.value })}
                    placeholder="https://10.244.20.5"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estado Nodo 2
                  </label>
                  <select
                    value={formData.node2Role}
                    onChange={(e) => setFormData({ ...formData, node2Role: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="primary">🟢 Primario</option>
                    <option value="backup">⚪ Backup</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Paths de acceso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Path SMP (Portal Management IRIS)
            </label>
            <input
              type="text"
              value={formData.smpPath}
              onChange={(e) => setFormData({ ...formData, smpPath: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Portal de administración del motor InterSystems IRIS
            </p>
          </div>

          {instance.layer === 'trakcare' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Path TrakCare (UI Clínica)
              </label>
              <input
                type="text"
                value={formData.trakcarePath}
                onChange={(e) => setFormData({ ...formData, trakcarePath: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Interfaz web de la aplicación clínica TrakCare
              </p>
            </div>
          )}

          {/* Preview */}
          {formData.gatewayUrl && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
              <p className="font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vista previa de accesos:
              </p>
              {instance.layer === 'trakcare' && (
                <div>
                  <span className="text-slate-500">TrakCare UI (VIP):</span>{' '}
                  {normalizeToHttps(formData.gatewayUrl) + formData.trakcarePath}
                </div>
              )}
              <div>
                <span className="text-slate-500">SMP Portal (VIP):</span>{' '}
                {normalizeToHttps(formData.gatewayUrl) + formData.smpPath}
              </div>

              {formData.hasHA && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                  {formData.node1Url && (
                    <div>
                      <span className="text-slate-500">
                        Nodo 1 ({formData.node1Role === 'backup' ? 'Backup' : 'Primario'}):
                      </span>{' '}
                      {normalizeToHttps(formData.node1Url) + (instance.layer === 'trakcare' ? formData.trakcarePath : formData.smpPath)}
                    </div>
                  )}
                  {formData.node2Url && (
                    <div>
                      <span className="text-slate-500">
                        Nodo 2 ({formData.node2Role === 'primary' ? 'Primario' : 'Backup'}):
                      </span>{' '}
                      {normalizeToHttps(formData.node2Url) + (instance.layer === 'trakcare' ? formData.trakcarePath : formData.smpPath)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
