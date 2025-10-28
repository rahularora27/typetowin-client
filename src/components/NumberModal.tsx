import React from "react";

interface NumberModalProps {
  open: boolean;
  title: string;
  value: string;
  placeholder: string;
  min: number;
  max: number;
  onChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function NumberModal({
  open,
  title,
  value,
  placeholder,
  min,
  max,
  onChange,
  onCancel,
  onSubmit,
}: NumberModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#2c2e31]/95 p-8 rounded-xl border border-gray-700 shadow-2xl">
        <h3 className="text-xl font-medium text-gray-200 mb-5">{title}</h3>
        <form onSubmit={onSubmit}>
          <div className="mb-5">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              min={min}
              max={max}
              className="w-full px-4 py-3 bg-[#323437] border border-gray-700 rounded-md text-gray-200 text-base focus:outline-none focus:border-[#e2b714]"
              autoFocus
            />
          </div>
          <div className="flex space-x-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm bg-[#e2b714] text-[#323437] rounded-md hover:bg-[#d5a00f] transition-colors"
            >
              ok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NumberModal;
