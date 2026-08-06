import { ExternalLink, Server, Box, Edit3, Globe, Network, Settings, Key, Trash2, GitBranch, Code, Terminal, Copy, FileCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { EditInstanceModal } from './EditInstanceModal';
import { EditClientVpnModal } from './EditClientVpnModal';
import { EditCredentialsModal } from './EditCredentialsModal';
import { DeleteClientModal } from './DeleteClientModal';

const DEFAULT_ENVS = ['BASE', 'UAT', 'LIVE'];

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
  requiresVpn: boolean;
  authType: string | null;
  username: string | null;
  password: string | null;
  credentials?: string | null;
  ssoProvider: string | null;
  ssoUrl: string | null;
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
  instances: Instance[];
}

interface ClientCardProps {
  client: Client;
}

const envColors = {
  BASE: 'bg-emerald-500',
  DEV: 'bg-emerald-500',
  TEST: 'bg-amber-500',
  UAT: 'bg-amber-500',
  LIVE: 'bg-red-500',
  PROD: 'bg-red-500',
  SCRATCH: 'bg-slate-500',
};

const layerIcons = {
  trakcare: Globe,
  integration: Network,
  smp: Box,
};

const layerNames = {
  trakcare: 'Clínica (TrakCare)',
  integration: 'Integraciones (INT)',
  smp: 'Portal SMP',
};

const vpnIcons = {
  cisco: '🔐 Cisco',
  globalprotect: '🌐 GlobalProtect',
  forticlient: '🛡️ FortiClient',
  rdp: '🖥️ RDP',
  openvpn: '🔒 OpenVPN',
};

function getAccounts(layer: Instance): Array<{ id: string; label: string; type: string; username?: string }> {
  if (layer.credentials) {
    try {
      const parsed = typeof layer.credentials === 'string'
        ? JSON.parse(layer.credentials)
        : layer.credentials;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }

  if (layer.authType === 'sso') {
    return [{ id: '1', label: 'Acceso SSO', type: 'sso' }];
  }
  if (layer.authType === 'none') {
    return [{ id: '1', label: 'Sin Auth', type: 'none' }];
  }
  if (layer.username || layer.password) {
    return [{ id: '1', label: 'Principal', type: 'userpass', username: layer.username || '' }];
  }

  return [];
}

export function ClientCard({ client }: ClientCardProps) {
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [editingVpn, setEditingVpn] = useState(false);
  const [editingCredentials, setEditingCredentials] = useState<Instance | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Asegurar que BASE, UAT y LIVE siempre existan + cualquier ambiente adicional
  const existingEnvs = Array.from(new Set(client.instances.map((inst) => inst.environment)));
  const allEnvs = Array.from(new Set([...DEFAULT_ENVS, ...existingEnvs]));

  // Ordenar: BASE, UAT, LIVE primero, luego los adicionales alfabéticamente
  const availableEnvs = allEnvs.sort((a, b) => {
    const priorityOrder = ['BASE', 'UAT', 'LIVE'];
    const indexA = priorityOrder.indexOf(a);
    const indexB = priorityOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const [selectedEnv, setSelectedEnv] = useState<string>(availableEnvs[0] || 'BASE');

  const handleCreateLayer = async (env: string, layerType: 'trakcare' | 'integration' | 'smp' = 'trakcare') => {
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          environment: env,
          layer: layerType,
          namespace: `${env}-${client.code}`,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error creando capa:', err);
    }
  };

  const handleSaveInstance = async (updates: Partial<Instance>) => {
    if (!editingInstance) return;

    const response = await fetch(`/api/instances/${editingInstance.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  const handleSaveVpn = async (updates: Partial<Client>) => {
    const response = await fetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  const handleSaveCredentials = async (updates: Partial<Instance>) => {
    if (!editingCredentials) return;

    const response = await fetch(`/api/instances/${editingCredentials.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/clients/${client.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  const handleOpenVSCode = () => {
    if (!client.folderPath) return;
    // vscode://file/{path}
    window.location.href = `vscode://file/${client.folderPath}`;
  };

  const handleCopyPath = async () => {
    if (!client.folderPath) return;
    try {
      await navigator.clipboard.writeText(client.folderPath);
      // Opcional: mostrar un toast/notificación
    } catch (error) {
      console.error('Error copiando ruta:', error);
    }
  };

  const handleOpenTerminal = async () => {
    if (!client.folderPath) return;
    try {
      await fetch('/api/open-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          editor: 'terminal',
          path: client.folderPath 
        }),
      });
    } catch (error) {
      console.error('Error abriendo terminal:', error);
    }
  };

  // Obtener todas las capas del ambiente seleccionado
  const layersInEnv = client.instances.filter((inst) => inst.environment === selectedEnv);

  const getEnvColor = (env: string): string => {
    return envColors[env as keyof typeof envColors] || 'bg-slate-500';
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      {/* Header del cliente */}
      <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {client.code}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {client.name}
            </p>
          </div>
          <div className="flex items-start gap-2">
            {/* Links externos */}
            <div className="flex items-center gap-1">
              {client.ccrUrl ? (
                <a
                  href={client.ccrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                  title="Abrir CCR (Control de Cambios)"
                >
                  <FileCheck className="w-4 h-4" />
                </a>
              ) : client.gitRepo ? (
                <a
                  href={client.gitRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  title="Abrir repositorio Git"
                >
                  <GitBranch className="w-4 h-4" />
                </a>
              ) : null}
              {client.folderPath && (
                <>
                  <button
                    onClick={handleCopyPath}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Copiar ruta"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenTerminal}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Abrir terminal"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenVSCode}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Abrir en VSCode"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Configuración y VPN */}
            <button
              onClick={() => setEditingVpn(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Configurar proyecto"
            >
              <Settings className="w-4 h-4" />
            </button>
            {/* VPN */}
            {client.vpnType && (
              <button
                onClick={() => setEditingVpn(true)}
                className="flex flex-col items-end gap-1 group/vpn cursor-pointer"
                title="Editar VPN"
              >
                <div className="text-xs font-medium text-amber-600 dark:text-amber-500 group-hover/vpn:text-amber-700 dark:group-hover/vpn:text-amber-400 transition-colors">
                  {vpnIcons[client.vpnType as keyof typeof vpnIcons] || client.vpnType}
                </div>
                {client.vpnHost && (
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {client.vpnHost}
                  </div>
                )}
              </button>
            )}

            {/* Eliminar */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Eliminar proyecto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector de ambiente */}
        <div className="flex gap-2 flex-wrap items-center">
          {availableEnvs.map((env) => (
            <button
              key={env}
              onClick={() => setSelectedEnv(env)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                selectedEnv === env
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${getEnvColor(env)}`} />
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Capas del ambiente seleccionado */}
      <div className="p-4 space-y-3">
        {layersInEnv.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ambiente <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEnv}</span> sin capas configuradas.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => handleCreateLayer(selectedEnv, 'trakcare')}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Capa TrakCare
              </button>
              <button
                onClick={() => handleCreateLayer(selectedEnv, 'integration')}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Integration
              </button>
              <button
                onClick={() => handleCreateLayer(selectedEnv, 'smp')}
                className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-950/40 hover:bg-purple-200 text-purple-700 dark:text-purple-300 rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> SMP
              </button>
            </div>
          </div>
        ) : (
          layersInEnv.map((layer) => {
            const Icon = layerIcons[layer.layer as keyof typeof layerIcons] || Server;
            const layerName = layerNames[layer.layer as keyof typeof layerNames] || layer.layer;

            return (
              <div
                key={layer.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50"
              >
                {/* Header de la capa */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {layerName}
                    </span>
                    {layer.namespace && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {layer.namespace}
                      </span>
                    )}
                    {getAccounts(layer).length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {getAccounts(layer).map((acc, i) => (
                          <span
                            key={acc.id || i}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              acc.type === 'sso'
                                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                : acc.type === 'none'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            }`}
                            title={acc.label ? `${acc.label} (${acc.type})` : acc.type}
                          >
                            {acc.type === 'sso'
                              ? '🔑 SSO'
                              : acc.type === 'none'
                              ? '🔓 Public'
                              : `🔐 ${acc.username || acc.label || 'Basic'}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {layer.hasHA && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                        HA
                      </span>
                    )}
                    <button
                      onClick={() => setEditingCredentials(layer)}
                      className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Credenciales"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingInstance(layer)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Configurar URLs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Accesos - TrakCare o SMP según la capa */}
                <div className="space-y-1.5">
                  {layer.layer === 'smp' ? (
                    /* Solo SMP para capa smp */
                    <>
                      {layer.gatewayUrl && (
                        <a
                          href={layer.gatewayUrl + (layer.smpPath || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group/link"
                        >
                          <Box className="w-3 h-3" />
                          <span className="flex-1 truncate font-medium">
                            {layer.hasHA ? 'SMP Portal (VIP)' : 'SMP Portal'}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      )}
                      {/* Nodos HA en una sola línea */}
                      {(layer.node1Url || layer.node2Url) && (
                        <div className="flex gap-2">
                          {layer.node1Url && (
                            <a
                              href={layer.node1Url + (layer.smpPath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3" />
                              <span className="truncate">Nodo 1</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {layer.node2Url && (
                            <a
                              href={layer.node2Url + (layer.smpPath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3" />
                              <span className="truncate">Nodo 2</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  ) : layer.layer === 'integration' ? (
                    /* Solo SMP para capa integration */
                    <>
                      {layer.gatewayUrl && (
                        <a
                          href={layer.gatewayUrl + (layer.smpPath || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group/link"
                        >
                          <Box className="w-3 h-3" />
                          <span className="flex-1 truncate font-medium">
                            {layer.hasHA ? 'SMP Portal (VIP)' : 'SMP Portal'}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      )}
                      {/* Nodos HA en una sola línea */}
                      {(layer.node1Url || layer.node2Url) && (
                        <div className="flex gap-2 pt-0.5">
                          {layer.node1Url && (
                            <a
                              href={layer.node1Url + (layer.smpPath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3 text-slate-400" />
                              <span className="truncate">Nodo 1</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                layer.node1Role === 'backup'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              }`}>
                                {layer.node1Role === 'backup' ? '⚪ Backup' : '🟢 Primario'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {layer.node2Url && (
                            <a
                              href={layer.node2Url + (layer.smpPath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3 text-slate-400" />
                              <span className="truncate">Nodo 2</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                layer.node2Role === 'primary'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {layer.node2Role === 'primary' ? '🟢 Primario' : '⚪ Backup'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* TrakCare + SMP para capa trakcare */
                    <>
                      {/* TrakCare */}
                      {layer.gatewayUrl && (
                        <a
                          href={layer.gatewayUrl + (layer.trakcarePath || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/link"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="flex-1 truncate font-medium">
                            {layer.hasHA ? 'TrakCare UI (VIP)' : 'TrakCare UI'}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      )}
                      {/* Nodos HA en una sola línea */}
                      {(layer.node1Url || layer.node2Url) && (
                        <div className="flex gap-2 pt-0.5">
                          {layer.node1Url && (
                            <a
                              href={layer.node1Url + (layer.trakcarePath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3 text-slate-400" />
                              <span className="truncate">Nodo 1</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                layer.node1Role === 'backup'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              }`}>
                                {layer.node1Role === 'backup' ? '⚪ Backup' : '🟢 Primario'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                          {layer.node2Url && (
                            <a
                              href={layer.node2Url + (layer.trakcarePath || '')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 group/link"
                            >
                              <Server className="w-3 h-3 text-slate-400" />
                              <span className="truncate">Nodo 2</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                                layer.node2Role === 'primary'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {layer.node2Role === 'primary' ? '🟢 Primario' : '⚪ Backup'}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Divider */}
                      {layer.gatewayUrl && <hr className="border-slate-200 dark:border-slate-700 my-2" />}

                      {/* SMP */}
                      {layer.gatewayUrl && (
                        <a
                          href={layer.gatewayUrl + (layer.smpPath || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group/link"
                        >
                          <Box className="w-3 h-3" />
                          <span className="flex-1 truncate">
                            {layer.hasHA ? 'SMP Portal (VIP)' : 'SMP Portal'}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de edición de instancia */}
      {editingInstance && (
        <EditInstanceModal
          instance={editingInstance}
          onClose={() => setEditingInstance(null)}
          onSave={handleSaveInstance}
        />
      )}

      {/* Modal de configuración VPN */}
      {editingVpn && (
        <EditClientVpnModal
          client={client}
          onClose={() => setEditingVpn(false)}
          onSave={handleSaveVpn}
        />
      )}

      {/* Modal de credenciales */}
      {editingCredentials && (
        <EditCredentialsModal
          instance={editingCredentials}
          onClose={() => setEditingCredentials(null)}
          onSave={handleSaveCredentials}
        />
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <DeleteClientModal
          client={client}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
