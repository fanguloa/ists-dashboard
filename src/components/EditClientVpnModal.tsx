import { X, Shield, Folder, FileCheck, Server, Settings, Plus, Globe } from 'lucide-react';
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
}

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
  instances?: Instance[];
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

const DEFAULT_ENVS = ['BASE', 'UAT', 'LIVE'];

export function EditClientVpnModal({ client, onClose, onSave }: EditClientVpnModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'environments'>('general');

  // Estado General
  const [formData, setFormData] = useState({
    name: client.name || '',
    vpnType: client.vpnType || '',
    vpnHost: client.vpnHost || '',
    vpnRange: client.vpnRange || '',
    gitRepo: client.gitRepo || '',
    folderPath: client.folderPath || '',
    ccrUrl: client.ccrUrl || '',
  });

  // Estado de Ambientes
  const clientInstances = client.instances || [];
  const existingEnvs = Array.from(new Set(clientInstances.map((i) => i.environment)));
  const allEnvs = Array.from(new Set([...DEFAULT_ENVS, ...existingEnvs])).sort((a, b) => {
    const priority = ['BASE', 'UAT', 'LIVE'];
    const idxA = priority.indexOf(a);
    const idxB = priority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const [selectedEnv, setSelectedEnv] = useState<string>(allEnvs[0] || 'BASE');
  const [newEnvName, setNewEnvName] = useState('');
  const [showAddEnv, setShowAddEnv] = useState(false);

  // Mapear configuración de ambiente seleccionada
  const envInstances = clientInstances.filter((i) => i.environment === selectedEnv);
  const sampleInst = envInstances[0];

  const [envData, setEnvData] = useState<Record<string, {
    hasHA: boolean;
    gatewayUrl: string;
    node1Url: string;
    node2Url: string;
    node1Role: string;
    node2Role: string;
    smpPath: string;
    trakcarePath: string;
  }>>(() => {
    const initialMap: Record<string, any> = {};
    for (const env of allEnvs) {
      const insts = clientInstances.filter((i) => i.environment === env);
      const first = insts[0];
      initialMap[env] = {
        hasHA: insts.some((i) => i.hasHA),
        gatewayUrl: first?.gatewayUrl || '',
        node1Url: first?.node1Url || '',
        node2Url: first?.node2Url || '',
        node1Role: first?.node1Role || 'primary',
        node2Role: first?.node2Role || 'backup',
        smpPath: first?.smpPath || '/csp/sys/%25CSP.Portal.Home.zen',
        trakcarePath: first?.trakcarePath || '/csp/system.Home.cls',
      };
    }
    return initialMap;
  });

  const [saving, setSaving] = useState(false);

  const handleEnvFieldChange = (field: string, value: any) => {
    setEnvData((prev) => ({
      ...prev,
      [selectedEnv]: {
        ...(prev[selectedEnv] || {
          hasHA: false,
          gatewayUrl: '',
          node1Url: '',
          node2Url: '',
          node1Role: 'primary',
          node2Role: 'backup',
          smpPath: '/csp/sys/%25CSP.Portal.Home.zen',
          trakcarePath: '/csp/system.Home.cls',
        }),
        [field]: value,
      },
    }));
  };

  const handleAddCustomEnv = async () => {
    const cleanName = newEnvName.toUpperCase().trim();
    if (!cleanName) return;

    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          environment: cleanName,
          layer: 'trakcare',
          namespace: `${cleanName}-${client.code}`,
        }),
      });

      if (response.ok) {
        setEnvData((prev) => ({
          ...prev,
          [cleanName]: {
            hasHA: false,
            gatewayUrl: '',
            node1Url: '',
            node2Url: '',
            node1Role: 'primary',
            node2Role: 'backup',
            smpPath: '/csp/sys/%25CSP.Portal.Home.zen',
            trakcarePath: '/csp/system.Home.cls',
          },
        }));
        setSelectedEnv(cleanName);
        setNewEnvName('');
        setShowAddEnv(false);
      }
    } catch (err) {
      console.error('Error agregando ambiente:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Guardar datos generales del cliente
      await onSave(formData);

      // 2. Guardar configuraciones de ambiente cambiadas
      for (const env of Object.keys(envData)) {
        const data = envData[env];
        await fetch('/api/environments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client.id,
            environment: env,
            hasHA: data.hasHA,
            gatewayUrl: data.gatewayUrl,
            node1Url: data.node1Url,
            node2Url: data.node2Url,
            node1Role: data.node1Role,
            node2Role: data.node2Role,
            smpPath: data.smpPath,
            trakcarePath: data.trakcarePath,
          }),
        });
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      setSaving(false);
    }
  };

  const currentEnvConf = envData[selectedEnv] || {
    hasHA: false,
    gatewayUrl: '',
    node1Url: '',
    node2Url: '',
    node1Role: 'primary',
    node2Role: 'backup',
    smpPath: '/csp/sys/%25CSP.Portal.Home.zen',
    trakcarePath: '/csp/system.Home.cls',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Configuración del Proyecto
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {client.code} · {client.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            General & VPN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('environments')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'environments'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Ambientes, HA & Nodos
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Tab 1: General & VPN */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Nombre del proyecto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del proyecto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Asociación Chilena de Seguridad"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Configuración VPN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de VPN
                  </label>
                  <select
                    value={formData.vpnType}
                    onChange={(e) => setFormData({ ...formData, vpnType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Sin VPN</option>
                    {vpnTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.vpnType && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Host / IP del VPN
                    </label>
                    <input
                      type="text"
                      value={formData.vpnHost}
                      onChange={(e) => setFormData({ ...formData, vpnHost: e.target.value })}
                      placeholder="vpn.ejemplo.com"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                )}
              </div>

              {formData.vpnType && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rango de red IP (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.vpnRange}
                    onChange={(e) => setFormData({ ...formData, vpnRange: e.target.value })}
                    placeholder="10.244.0.0/16"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              )}

              {/* Links del Proyecto */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Links del Proyecto
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Link a CCR (Control de Cambios)
                    </label>
                    <input
                      type="url"
                      value={formData.ccrUrl}
                      onChange={(e) => setFormData({ ...formData, ccrUrl: e.target.value })}
                      placeholder="https://ccr.intersystems.com/..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-blue-500" />
                      Carpeta local
                    </label>
                    <input
                      type="text"
                      value={formData.folderPath}
                      onChange={(e) => setFormData({ ...formData, folderPath: e.target.value })}
                      placeholder="C:\Proyectos\ACHS"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ambientes & HA */}
          {activeTab === 'environments' && (
            <div className="space-y-4">
              {/* Selector de ambiente dentro del modal */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex gap-1.5 flex-wrap">
                  {allEnvs.map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setSelectedEnv(env)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                        selectedEnv === env
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>

                {!showAddEnv ? (
                  <button
                    type="button"
                    onClick={() => setShowAddEnv(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Ambiente
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newEnvName}
                      onChange={(e) => setNewEnvName(e.target.value.toUpperCase())}
                      placeholder="DEV"
                      className="w-20 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEnv}
                      className="px-2 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                    >
                      Crear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddEnv(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Formulario de Configuración de Ambiente */}
              <div className="space-y-4">
                {/* HA Toggle */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <label htmlFor="modalEnvHasHA" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Alta Disponibilidad (HA) para {selectedEnv}
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Habilita la arquitectura con VIP Gateway y 2 Nodos (Primario / Backup)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="modalEnvHasHA"
                    checked={currentEnvConf.hasHA}
                    onChange={(e) => handleEnvFieldChange('hasHA', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* VIP / Gateway URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    URL del Gateway / VIP ({selectedEnv})
                  </label>
                  <input
                    type="url"
                    value={currentEnvConf.gatewayUrl}
                    onChange={(e) => handleEnvFieldChange('gatewayUrl', e.target.value)}
                    placeholder="https://10.244.20.6"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                {/* Nodos HA */}
                {currentEnvConf.hasHA && (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nodos HA para {selectedEnv}
                    </h4>

                    {/* Nodo 1 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Nodo 1 URL
                        </label>
                        <input
                          type="url"
                          value={currentEnvConf.node1Url}
                          onChange={(e) => handleEnvFieldChange('node1Url', e.target.value)}
                          placeholder="https://10.244.20.4"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Rol Nodo 1
                        </label>
                        <select
                          value={currentEnvConf.node1Role}
                          onChange={(e) => handleEnvFieldChange('node1Role', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                        >
                          <option value="primary">🟢 Primario</option>
                          <option value="backup">⚪ Backup</option>
                        </select>
                      </div>
                    </div>

                    {/* Nodo 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Nodo 2 URL
                        </label>
                        <input
                          type="url"
                          value={currentEnvConf.node2Url}
                          onChange={(e) => handleEnvFieldChange('node2Url', e.target.value)}
                          placeholder="https://10.244.20.5"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Rol Nodo 2
                        </label>
                        <select
                          value={currentEnvConf.node2Role}
                          onChange={(e) => handleEnvFieldChange('node2Role', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                        >
                          <option value="primary">🟢 Primario</option>
                          <option value="backup">⚪ Backup</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Path SMP (Portal IRIS)
                    </label>
                    <input
                      type="text"
                      value={currentEnvConf.smpPath}
                      onChange={(e) => handleEnvFieldChange('smpPath', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Path TrakCare (UI Clínica)
                    </label>
                    <input
                      type="text"
                      value={currentEnvConf.trakcarePath}
                      onChange={(e) => handleEnvFieldChange('trakcarePath', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
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
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
