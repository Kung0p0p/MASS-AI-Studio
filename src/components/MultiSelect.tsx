import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options = [], selected = [], onChange, placeholder = "ทั้งหมด" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(x => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative inline-block text-left w-full h-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs md:text-sm bg-white flex items-center justify-between w-full shadow-sm hover:bg-slate-50 transition-colors h-[38px] min-w-[150px]"
      >
        <span className="truncate pr-2 text-slate-700 font-medium">
          {selected?.length === 0 ? placeholder : `เลือกแล้ว ${selected?.length || 0} รายการ`}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[200px] rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-[5000] overflow-hidden">
          <div className="max-h-[50vh] sm:max-h-60 overflow-y-auto py-2 custom-scrollbar">
            {options?.map(opt => (
              <label key={opt} className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selected?.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="mr-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-slate-600 truncate" title={opt}>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
