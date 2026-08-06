import { useState, useMemo } from 'react';
import { SearchBar } from './SearchBar';
import { ClientCard } from './ClientCard';
import { CreateClientModal } from './CreateClientModal';
import { ThemeToggle } from './ThemeToggle';
import { Plus, Settings } from 'lucide-react';

interface Instance {
  id: number;
  clientId: number;
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
  notes: string | null;
}

interface Client {
  id: number;
  code: string;
  name: string;
  color: string | null;
  vpnRange: string | null;
  vpnType: string | null;
  vpnHost: string | null;
  gitRepo: string | null;
  folderPath: string | null;
  ccrUrl: string | null;
  icon: string | null;
  instances: Instance[];
}

interface DashboardProps {
  initialClients: Client[];
}

export function Dashboard({ initialClients }: DashboardProps) {
  const [clients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateClient = async (data: { code: string; name: string }) => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      window.location.reload();
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.code.toLowerCase().includes(query) ||
        client.name.toLowerCase().includes(query) ||
        client.instances.some(
          (inst) =>
            inst.environment.toLowerCase().includes(query) ||
            inst.namespace?.toLowerCase().includes(query)
        )
    );
  }, [clients, searchQuery]);

  const totalInstances = clients.reduce((sum, c) => sum + c.instances.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header minimalista y responsive */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
              <h1 className="text-xl sm:text-2xl font-light tracking-tight text-slate-900 dark:text-slate-100">
                TrakControl
              </h1>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {clients.length} clientes
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {totalInstances} instancias
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <ThemeToggle />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo proyecto</span>
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-3 sm:mt-4 max-w-md w-full">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </header>

      {/* Grid de clientes */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
              No se encontraron resultados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </main>

      {/* Modal de creación */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateClient}
        />
      )}
    </div>
  );
}
