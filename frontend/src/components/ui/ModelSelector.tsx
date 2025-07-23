// frontend/src/components/ui/ModelSelector.tsx
'use client';

import { AppConfig } from '@/config/settings';
import { useEffect, useState } from 'react';

type ModelKey = 'lite' | 'full' | 'heavy';

interface ModelSelectorProps {
  selectedModel: ModelKey;
  setSelectedModel: (model: ModelKey) => void;
}

export const ModelSelector = ({ selectedModel, setSelectedModel }: ModelSelectorProps) => {
  // State to hold only the models that actually exist
  const [availableModels, setAvailableModels] = useState<Record<string, { name: string, path: string }>>({});

  useEffect(() => {
    const checkModels = async () => {
      const verifiedModels: Record<string, { name: string, path: string }> = {};
      for (const [key, value] of Object.entries(AppConfig.ai.models)) {
        try {
          // Try to fetch the model file's headers. A 404 will throw an error.
          const response = await fetch(value.path, { method: 'HEAD' });
          if (response.ok) {
            verifiedModels[key] = value;
          }
        } catch { // The error object can be omitted entirely if unused
          console.warn(`Model file not found for '${key}', hiding from selector.`);
        }
      }
      setAvailableModels(verifiedModels);
    };

    checkModels();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-select" className="text-sm font-medium text-gray-300">Model:</label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
      >
        {Object.entries(availableModels).map(([key, value]) => (
          <option key={key} value={key}>
            {value.name}
          </option>
        ))}
      </select>
    </div>
  );
};
