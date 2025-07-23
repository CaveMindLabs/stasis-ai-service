// frontend/src/components/ui/ToggleSwitch.tsx
'use client';

import { Switch } from '@headlessui/react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const ToggleSwitch = ({ label, enabled, setEnabled }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <Switch
        checked={enabled}
        onChange={setEnabled}
        className={`${enabled ? 'bg-blue-600' : 'bg-gray-700'}
          relative inline-flex h-[28px] w-[64px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
      >
        <span className="sr-only">{label}</span>
        
        {/* ON/OFF Text */}
        <span className={`absolute inset-0 flex items-center justify-start transition-opacity duration-200 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
          <span className="ml-2 text-xs font-semibold text-white">ON</span>
        </span>
        <span className={`absolute inset-0 flex items-center justify-end transition-opacity duration-200 ${enabled ? 'opacity-0' : 'opacity-100'}`}>
          <span className="mr-2 text-xs font-semibold text-gray-300">OFF</span>
        </span>

        {/* The moving circle */}
        <span
          aria-hidden="true"
          className={`${enabled ? 'translate-x-9' : 'translate-x-0'}
            pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
};
