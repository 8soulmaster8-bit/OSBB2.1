import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function initialsOf(fullName: string | undefined) {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0">
          {initialsOf(profile?.full_name)}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">
            {profile?.full_name || 'Користувач'}
          </p>
          <p className="text-xs text-slate-500">
            {profile?.apartment_number ? `Кв. ${profile.apartment_number}` : '—'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-200 py-2 z-50">
          <div className="px-4 py-2.5 border-b border-slate-100 sm:hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name || 'Користувач'}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Home className="w-3 h-3" />
              {profile?.apartment_number ? `Кв. ${profile.apartment_number}` : '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/profile');
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <User className="w-4 h-4 text-slate-400" />
            Профіль
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}
