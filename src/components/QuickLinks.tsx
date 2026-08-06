import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface QuickLink {
  id: number;
  clientId: number | null;
  title: string;
  url: string;
  category: string | null;
}

interface QuickLinksProps {
  links: QuickLink[];
  onAdd?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  ccr: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  jira: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  confluence: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  sharepoint: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  custom: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

export function QuickLinks({ links, onAdd }: QuickLinksProps) {
  if (links.length === 0 && !onAdd) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          Quick Links ({links.length})
        </h4>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Agregar
          </button>
        )}
      </div>

      <div className="space-y-1">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm group"
          >
            <LinkIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
              {link.title}
            </span>
            {link.category && link.category !== 'custom' && (
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  CATEGORY_COLORS[link.category] || CATEGORY_COLORS.custom
                }`}
              >
                {link.category.toUpperCase()}
              </span>
            )}
            <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
