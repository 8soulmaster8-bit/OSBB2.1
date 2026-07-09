import { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-2 px-3 bg-white/80 hover:bg-white rounded-lg border border-slate-200 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-slate-800">{profile.full_name || 'Користувач'}</p>
          <p className="text-xs text-slate-500">{profile.email}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
            <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
              <p className="text-sm font-medium text-slate-800">{profile.full_name}</p>
              <p className="text-xs text-slate-500">{profile.email}</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Налаштування
            </button>
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
                navigate('/login');
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Вийти
            </button>
          </div>
        </>
      )}
    </div>
  );
}
