import { X } from 'lucide-react';
import { useState } from 'react';

interface Instance {
  id: number;
  environment: string;
  hasHA: boolean;
  gatewayUrl: string | null;
  node1Url: string | null;
  node2Url: string | null;
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
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nodo 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.node1Url}
                  onChange={(e) => setFormData({ ...formData, node1Url: e.target.value })}
                  placeholder="https://10.244.20.4"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nodo 2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.node2Url}
                  onChange={(e) => setFormData({ ...formData, node2Url: e.target.value })}
                  placeholder="https://10.244.20.5"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
                />
              </div>
            </>
          )}

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Paths de acceso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Path SMP (Portal IRIS)
            </label>
            <input
              type="text"
              value={formData.smpPath}
              onChange={(e) => setFormData({ ...formData, smpPath: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Portal de gestión de IRIS
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Path TrakCare (Aplicación)
            </label>
            <input
              type="text"
              value={formData.trakcarePath}
              onChange={(e) => setFormData({ ...formData, trakcarePath: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aplicación de registro clínico
            </p>
          </div>

          {/* Preview */}
          {formData.gatewayUrl && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vista previa:
              </p>
              <div className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-500">TrakCare Gateway:</span>{' '}
                  {normalizeToHttps(formData.gatewayUrl) + formData.trakcarePath}
                </div>
                <div>
                  <span className="text-slate-500">SMP Gateway:</span>{' '}
                  {normalizeToHttps(formData.gatewayUrl) + formData.smpPath}
                </div>
                {formData.hasHA && formData.node1Url && (
                  <div className="mt-2">
                    <span className="text-slate-500">TrakCare Nodo 1:</span>{' '}
                    {normalizeToHttps(formData.node1Url) + formData.trakcarePath}
                  </div>
                )}
              </div>
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
