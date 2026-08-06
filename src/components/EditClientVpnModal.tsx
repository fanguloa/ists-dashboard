import { X, Shield, GitBranch, Folder, FileCheck } from 'lucide-react';
import { useState } from 'react';

interface Client {
  id: number;
  code: string;
  name: string;
  vpnRange: string | null;
  vpnType: string | null;
  vpnHost: string | null;
  gitRepo: string | null;
  folderPath: string | null;
  ccrUrl: string | null;
}

interface EditClientVpnModalProps {
  client: Client;
  onClose: () => void;
  onSave: (updated: Partial<Client>) => Promise<void>;
}

const vpnTypes = [
  { value: 'cisco', label: '🔐 Cisco AnyConnect' },
  { value: 'globalprotect', label: '🌐 Palo Alto GlobalProtect' },
  { value: 'forticlient', label: '🛡️ FortiClient' },
  { value: 'rdp', label: '🖥️ Escritorio Remoto (RDP)' },
  { value: 'openvpn', label: '🔒 OpenVPN' },
];

export function EditClientVpnModal({ client, onClose, onSave }: EditClientVpnModalProps) {
  const [formData, setFormData] = useState({
    name: client.name || '',
    vpnType: client.vpnType || '',
    vpnHost: client.vpnHost || '',
    vpnRange: client.vpnRange || '',
    gitRepo: client.gitRepo || '',
    folderPath: client.folderPath || '',
    ccrUrl: client.ccrUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando VPN:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Configuración
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {client.code}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre del proyecto */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Asociación Chilena de Seguridad"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          {/* Tipo de VPN */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de VPN
            </label>
            <select
              value={formData.vpnType}
              onChange={(e) => setFormData({ ...formData, vpnType: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100"
            >
              <option value="">Sin VPN</option>
              {vpnTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Host/IP del VPN */}
          {formData.vpnType && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Host / IP del VPN
              </label>
              <input
                type="text"
                value={formData.vpnHost}
                onChange={(e) => setFormData({ ...formData, vpnHost: e.target.value })}
                placeholder="vpn.ejemplo.com"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          )}

          {/* Rango de red VPN */}
          {formData.vpnType && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Rango de red (opcional)
              </label>
              <input
                type="text"
                value={formData.vpnRange}
                onChange={(e) => setFormData({ ...formData, vpnRange: e.target.value })}
                placeholder="10.244.0.0/16"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          )}

          {/* Preview */}
          {formData.vpnType && formData.vpnHost && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2.5 rounded-lg">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-0.5">
                {vpnTypes.find((t) => t.value === formData.vpnType)?.label}
              </p>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400">{formData.vpnHost}</p>
              {formData.vpnRange && (
                <p className="text-xs font-mono text-amber-600 dark:text-amber-500 mt-0.5">
                  {formData.vpnRange}
                </p>
              )}
            </div>
          )}

          {/* Links externos */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Links del proyecto
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileCheck className="w-3 h-3 text-emerald-500" />
                Link a CCR (Control de Cambios)
              </label>
              <input
                type="url"
                value={formData.ccrUrl}
                onChange={(e) => setFormData({ ...formData, ccrUrl: e.target.value })}
                placeholder="https://ccr.intersystems.com/..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3 h-3" />
                Carpeta local
              </label>
              <input
                type="text"
                value={formData.folderPath}
                onChange={(e) => setFormData({ ...formData, folderPath: e.target.value })}
                placeholder="C:\Proyectos\ACHS"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
