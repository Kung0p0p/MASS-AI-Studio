import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  colorTheme?: 'blue' | 'amber' | 'emerald';
  children: React.ReactNode;
}

export const FormModal: React.FC<FormModalProps> = ({ isOpen, onClose, title, icon, colorTheme = 'blue', children }) => {
  const themeMap = {
    blue: { text: 'text-blue-800', icon: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50' },
    amber: { text: 'text-amber-800', icon: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50' },
    emerald: { text: 'text-emerald-800', icon: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50' },
  };
  const theme = themeMap[colorTheme];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
          >
            <div className={`px-5 py-4 border-b border-slate-200 flex justify-between items-center ${theme.bg} shrink-0`}>
              <h2 className={`text-lg font-bold flex items-center ${theme.text}`}>
                <span className="mr-3 text-xl">{icon}</span> {title}
              </h2>
              <button onClick={onClose} className="w-8 h-8 flex justify-center items-center rounded-full bg-white hover:bg-slate-200 text-slate-500 shadow-sm border transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
