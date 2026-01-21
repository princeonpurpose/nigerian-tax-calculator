/**
 * Module selector component for navigating between tax calculators
 */

import { cn } from '@/utils/cn';

export type TaxModule = 'pit' | 'cit' | 'cgt' | 'vat' | 'compliance';

interface ModuleSelectorProps {
  activeModule: TaxModule;
  onModuleChange: (module: TaxModule) => void;
}

const modules: { id: TaxModule; label: string; icon: string; description: string }[] = [
  { 
    id: 'pit', 
    label: 'Personal Tax', 
    icon: '👤', 
    description: 'PIT/PAYE Calculator' 
  },
  { 
    id: 'cit', 
    label: 'Corporate Tax', 
    icon: '🏢', 
    description: 'CIT Calculator' 
  },
  { 
    id: 'cgt', 
    label: 'Capital Gains', 
    icon: '📈', 
    description: 'CGT Calculator' 
  },
  { 
    id: 'vat', 
    label: 'VAT', 
    icon: '🧾', 
    description: 'VAT Calculator' 
  },
  { 
    id: 'compliance', 
    label: 'Compliance', 
    icon: '📋', 
    description: 'Filing & TIN Info' 
  },
];

export function ModuleSelector({ activeModule, onModuleChange }: ModuleSelectorProps) {
  return (
    <div className="w-full overflow-x-auto">
      <nav className="flex gap-2 min-w-max p-1">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-all duration-200',
              'hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
              activeModule === module.id
                ? 'bg-green-100 text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-green-700'
            )}
          >
            <span className="text-2xl">{module.icon}</span>
            <span className="font-medium text-sm">{module.label}</span>
            <span className="text-xs text-gray-500 hidden sm:block">{module.description}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
