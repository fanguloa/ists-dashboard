import { X, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Client {
  id: number;
  code: string;
  name: string;
}

interface DeleteClientModalProps {
  client: Client;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteClientModal({ client, onClose, onConfirm }: DeleteClientModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== client.code) return;

    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = confirmText === client.code;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              Eliminar proyecto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
              ⚠️ Esta acción NO se puede deshacer
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">
              Se eliminarán permanentemente:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-400 mt-2 ml-4 space-y-1">
              <li>• Todas las instancias (BASE, UAT, LIVE, etc.)</li>
              <li>• Todas las credenciales guardadas</li>
              <li>• Configuración de VPN</li>
              <li>• Links rápidos asociados</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              Estás por eliminar <span className="font-bold">{client.name}</span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Para confirmar, escribí el código del proyecto:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={client.code}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-slate-100 font-mono"
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete || deleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Eliminando...' : 'Eliminar proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
