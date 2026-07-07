import { Droplets, Zap, Flame, AlertCircle, UserCheck, CheckCircle } from 'lucide-react';

export const getMeterIcon = (type: string, className = 'w-5 h-5') => {
  switch (type) {
    case 'water':
    case 'cold_water':
      return <Droplets className={`${className} text-cyan-500`} />;
    case 'hot_water':
      return <Droplets className={`${className} text-rose-500`} />;
    case 'electricity':
      return <Zap className={`${className} text-amber-500`} />;
    case 'gas':
      return <Flame className={`${className} text-orange-500`} />;
    default:
      return null;
  }
};

export const getMeterLabel = (type: string) => {
  switch (type) {
    case 'water':
    case 'cold_water':
      return 'Холодная вода';
    case 'hot_water':
      return 'Горячая вода';
    case 'electricity':
      return 'Электричество';
    case 'gas':
      return 'Газ';
    default:
      return type;
  }
};

export const getMeterColor = (type: string) => {
  switch (type) {
    case 'water':
    case 'cold_water':
      return 'from-cyan-500 to-teal-500';
    case 'hot_water':
      return 'from-rose-500 to-orange-500';
    case 'electricity':
      return 'from-amber-500 to-yellow-500';
    case 'gas':
      return 'from-orange-500 to-red-500';
    default:
      return 'from-slate-500 to-slate-600';
  }
};

export const getMeterUnit = (type: string) => {
  switch (type) {
    case 'water':
    case 'cold_water':
    case 'hot_water':
    case 'gas':
      return 'м³';
    case 'electricity':
      return 'кВт⋅ч';
    default:
      return '';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case 'in_progress':
      return <UserCheck className="w-4 h-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    default:
      return null;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return '';
  }
};
