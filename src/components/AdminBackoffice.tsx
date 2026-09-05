import React, { useState, useEffect } from 'react';
import { UserProfile, Delivery, PaymentTransaction } from '../types';
import { storageService } from '../services/storageService';
import { firestoreService } from '../services/firestoreService';
import {
  Users,
  TrendingUp,
  Wallet,
  AlertCircle,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Zap,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminBackofficeProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
}

export const AdminBackoffice: React.FC<AdminBackofficeProps> = ({
  currentUser,
  onLogout,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'deliveries' | 'payments' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [adminPin, setAdminPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [sessionPin, setSessionPin] = useState('1234');
  const [newPin, setNewPin] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalRevenue: 0,
    platformBalance: 0,
    newUsersToday: 0,
    systemHealth: 'Excellent',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Get current user from storage
    const currentUserData = storageService.getUser();
    const users = currentUserData ? [currentUserData] : [];
    const deliveries = storageService.getDeliveries() || [];
    const paymentTransactions = storageService.getTransactions() || [];
    
    setAllUsers(users);
    setAllDeliveries(deliveries);
    setTransactions(paymentTransactions);

    const drivers = users.filter((u) => u.role === 'driver');
    const active = deliveries.filter((d) => d.status === 'in_transit' || d.status === 'nearby_500m' || d.status === 'alert_300m' || d.status === 'arrived');
    const completed = deliveries.filter((d) => d.status === 'delivered');

    setStats({
      totalUsers: users.length,
      totalDrivers: drivers.length,
      activeDeliveries: active.length,
      completedDeliveries: completed.length,
      totalRevenue: paymentTransactions.filter((tx) => tx.status === 'success').reduce((sum, tx) => sum + tx.amount, 0),
      platformBalance: paymentTransactions.filter((tx) => tx.status === 'success').reduce((sum, tx) => sum + tx.amount, 0),
      newUsersToday: users.filter((user) => user.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      systemHealth: 'Excellent',
    });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === sessionPin) {
      setIsPinUnlocked(true);
      setShowPinInput(false);
      setAdminPin('');
    }
  };

  if (!isPinUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-red-500 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Admin Backoffice</h2>
              <p className="text-sm text-slate-400">Authentification requise</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Code PIN (4 chiffres)</label>
                <input
                  type={showPinInput ? 'text' : 'password'}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 text-center text-2xl font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPinInput(!showPinInput)}
                  className="text-xs text-slate-400 hover:text-slate-300 mt-2"
                >
                  {showPinInput ? <EyeOff className="w-3.5 h-3.5 inline mr-1" /> : <Eye className="w-3.5 h-3.5 inline mr-1" />}
                  {showPinInput ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <button
                type="submit"
                disabled={adminPin.length !== 4}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Déverrouiller
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center">
              PIN initial de cette session : 1234
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Tab
  if (activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Admin Backoffice</h1>
          <button
            onClick={() => {
              setIsPinUnlocked(false);
              onLogout();
            }}
            className="px-4 py-2 bg-red-600/20 border border-red-500/40 rounded-xl text-red-300 hover:bg-red-600/40 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Utilisateurs Totaux"
            value={stats.totalUsers}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon={Zap}
            label="Livreurs Actifs"
            value={stats.totalDrivers}
            color="amber"
            trend="+8%"
          />
          <StatCard
            icon={TrendingUp}
            label="Livraisons Actives"
            value={stats.activeDeliveries}
            color="emerald"
            trend="+15%"
          />
          <StatCard
            icon={DollarSign}
            label="Solde Plateforme"
            value={`${stats.platformBalance.toLocaleString()} FCFA`}
            color="purple"
            trend="+24%"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              Activité Derniers 7 Jours
            </h3>
            <div className="space-y-2">
              {[85, 72, 91, 68, 88, 94, 81].map((val, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-8">J{i + 1}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-300">{val}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Distribution par Rôle
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Livreurs', count: stats.totalDrivers, color: 'amber' },
                { label: 'Commerçants', count: Math.floor(stats.totalUsers * 0.25), color: 'blue' },
                { label: 'Particuliers', count: Math.floor(stats.totalUsers * 0.35), color: 'emerald' },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${item.color}-500`}
                      style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 flex-wrap">
          {['users', 'deliveries', 'payments', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all font-semibold"
            >
              {tab === 'users' && '👥 Utilisateurs'}
              {tab === 'deliveries' && '📦 Livraisons'}
              {tab === 'payments' && '💳 Paiements'}
              {tab === 'settings' && '⚙️ Paramètres'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Users Tab
  if (activeTab === 'users') {
    const filtered = allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Gestion Utilisateurs</h1>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            ← Retour
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filtered.map((user) => (
              <div
                key={user.id}
                className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:bg-slate-900/60 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{user.name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          user.role === 'driver'
                            ? 'bg-amber-500/20 text-amber-300'
                            : user.role === 'merchant'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {user.role === 'driver' ? '🚚 Livreur' : user.role === 'merchant' ? '🏪 Commerçant' : '👤 Particulier'}
                      </span>
                      {user.isEmailVerified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      📱 {user.phone} • 📍 {user.city}
                    </p>
                    {user.role === 'driver' && (
                      <p className="text-sm text-slate-500 mt-1">
                        ⭐ {user.rating?.toFixed(1) || '5.0'} ({user.totalRatingsCount || 0} avis) • {user.completedDeliveries || 0} livraisons
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Deliveries Tab
  if (activeTab === 'deliveries') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Gestion Livraisons</h1>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all"
          >
            ← Retour
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            label="En cours"
            value={allDeliveries.filter((d) => d.status === 'in_transit').length}
            color="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Complétées"
            value={allDeliveries.filter((d) => d.status === 'delivered').length}
            color="emerald"
          />
          <StatCard
            icon={XCircle}
            label="Annulées"
            value={allDeliveries.filter((d) => d.status === 'cancelled').length}
            color="red"
          />
        </div>

        {/* Deliveries List */}
        <div className="space-y-3">
          {allDeliveries.slice(0, 10).map((delivery) => (
            <div key={delivery.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{delivery.trackingCode}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        delivery.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : delivery.status === 'in_transit'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {delivery.status === 'delivered'
                        ? '✓ Complétée'
                        : delivery.status === 'in_transit'
                        ? '🚚 En cours'
                        : delivery.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {delivery.pickupCity} → {delivery.dropoffCity}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    📦 {delivery.packageDescription} • 💰 {delivery.deliveryFee} FCFA
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'payments') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Gestion des paiements</h1>
            <p className="text-sm text-slate-400 mt-1">Suivi des transactions enregistrées</p>
          </div>
          <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all">Retour</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Wallet} label="Total encaissé" value={`${transactions.filter((tx) => tx.status === 'success').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()} FCFA`} color="emerald" />
          <StatCard icon={Clock} label="En attente" value={transactions.filter((tx) => tx.status === 'pending').length} color="amber" />
          <StatCard icon={AlertCircle} label="Échecs" value={transactions.filter((tx) => tx.status === 'failed').length} color="red" />
        </div>
        <div className="space-y-3">
          {transactions.length === 0 ? <p className="text-center py-10 text-slate-400">Aucune transaction enregistrée.</p> : transactions.map((tx) => (
            <div key={tx.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white">{tx.userName} <span className="text-xs text-slate-500">#{tx.reference}</span></p>
                <p className="text-sm text-slate-400">{tx.provider} · {tx.purpose} · {new Date(tx.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              <div className="text-right"><p className="font-black text-white">{tx.amount.toLocaleString()} FCFA</p><p className={`text-xs font-bold ${tx.status === 'success' ? 'text-emerald-400' : tx.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>{tx.status}</p></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-3xl font-black text-white">Paramètres administrateur</h1><button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all">Retour</button></div>
        <div className="max-w-xl bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-5">
          <div><h2 className="font-bold text-white">Contacts officiels</h2><p className="text-sm text-slate-300 mt-2">liencolisdrivercommunauty@gmail.com</p><p className="text-sm text-slate-300">+229 01 69 81 46 32 / +229 01 47 65 24 20</p></div>
          <div className="border-t border-slate-800 pt-5"><h2 className="font-bold text-white mb-3">Changer le PIN de cette session</h2><input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" placeholder="Nouveau PIN à 4 chiffres" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white" /><button onClick={() => { if (newPin.length === 4) { setSessionPin(newPin); setSettingsMessage('PIN modifié pour cette session.'); setNewPin(''); } else setSettingsMessage('Le PIN doit contenir 4 chiffres.'); }} className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Enregistrer</button>{settingsMessage && <p className="text-sm text-emerald-300 mt-2">{settingsMessage}</p>}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Onglet en développement</h2>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
        >
          Retour au Dashboard
        </button>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
}> = ({ icon: Icon, label, value, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    emerald: 'from-emerald-500/20 to-green-600/20 border-emerald-500/30 text-emerald-300',
    red: 'from-red-500/20 to-rose-600/20 border-red-500/30 text-red-300',
    purple: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30 text-purple-300',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-2xl p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-black text-white">{value}</p>
          {trend && <p className="text-xs text-emerald-300 font-bold mt-1">{trend} ce mois</p>}
        </div>
        <Icon className="w-6 h-6 opacity-60" />
      </div>
    </div>
  );
};
