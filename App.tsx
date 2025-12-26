
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  ChevronDown, 
  Filter, 
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Hexagon,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Globe,
  Lock,
  Moon,
  Sun,
  Monitor,
  Check,
  Save,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { USERS_MOCK_DATA, METRICS_DATA, ROLE_CONFIGS, ALL_PERMISSIONS } from './constants';
import { UserRole, User, Permission, RoleConfig } from './types';
import { getSmartInsights } from './geminiService';

// --- UI Components ---

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, label, active, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      disabled ? 'opacity-30 cursor-not-allowed' :
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {icon}
    <span className="font-semibold whitespace-nowrap overflow-hidden transition-all">{label}</span>
  </button>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
  <button 
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${
      enabled ? 'bg-indigo-600' : 'bg-slate-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// --- Main Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'roles' | 'analytics' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<User[]>(USERS_MOCK_DATA);
  const [roles, setRoles] = useState<RoleConfig[]>(ROLE_CONFIGS);
  const [currentUser, setCurrentUser] = useState<User>(USERS_MOCK_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [insights, setInsights] = useState<string[]>([]);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // App Settings State
  const [settings, setSettings] = useState({
    companyName: 'Nexus Enterprise',
    maintenanceMode: false,
    twoFactorAuth: true,
    darkMode: false,
    emailNotifications: true,
    autoBackup: true
  });

  // Modal & Popup States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.EMPLOYEE, department: 'Engineering' });

  // Notifications Store
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'System security audit completed', time: '5m ago', type: 'success' },
    { id: 2, text: 'New user deployment successful', time: '1h ago', type: 'info' },
    { id: 3, text: 'Warning: High server load detected in US-East-1', time: '3h ago', type: 'warning' },
  ]);

  // --- Logic Helpers ---

  const hasPermission = (permission: Permission) => {
    const roleCfg = roles.find(r => r.role === currentUser.role);
    return roleCfg?.permissions.includes(permission);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      ...newUser,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Active',
      lastActive: 'Just now'
    };
    setUsers([user, ...users]);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: UserRole.EMPLOYEE, department: 'Engineering' });
    pushNotification(`User ${user.name} added as ${user.role}`);
  };

  const deleteUser = (id: string) => {
    if (confirm('Delete this user account permanently?')) {
      const target = users.find(u => u.id === id);
      setUsers(users.filter(u => u.id !== id));
      pushNotification(`Account for ${target?.name} removed.`);
    }
  };

  const pushNotification = (text: string) => {
    setNotifications(prev => [{ id: Date.now(), text, time: 'Just now', type: 'info' }, ...prev]);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      pushNotification('Enterprise settings updated successfully');
    }, 800);
  };

  const fetchInsights = async () => {
    setIsInsightLoading(true);
    const result = await getSmartInsights(METRICS_DATA, users.length);
    setInsights(result);
    setIsInsightLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // --- View Renderers ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {METRICS_DATA.map((metric, idx) => (
          <div key={idx} className={`p-6 rounded-3xl shadow-sm border transition-all hover:shadow-md ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 text-sm font-semibold">{metric.label}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                metric.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                {metric.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metric.change}%
              </span>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className={`p-8 rounded-3xl border shadow-sm ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`font-bold text-lg mb-8 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Corporate Growth Metrics</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n:'Mon',v:2400},{n:'Tue',v:3200},{n:'Wed',v:2800},{n:'Thu',v:4500},{n:'Fri',v:3800},{n:'Sat',v:5100},{n:'Sun',v:4800}]}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.darkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: settings.darkMode ? '#0f172a' : '#fff', color: settings.darkMode ? '#fff' : '#000'}} />
                  <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className={`p-8 rounded-3xl border shadow-sm ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`font-bold text-lg mb-8 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Global Utilization Rate</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{n:'Ops',v:85},{n:'Dev',v:92},{n:'Sales',v:78},{n:'HR',v:65},{n:'Mark',v:88}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.darkMode ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: settings.darkMode ? '#1e293b' : '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: settings.darkMode ? '#0f172a' : '#fff'}} />
                  <Bar dataKey="v" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform">
                  <Sparkles size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-xl">Nexus AI Insights</h3>
              </div>
              <div className="space-y-5">
                {isInsightLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-4 bg-white/10 rounded-full w-full animate-pulse"></div>)}
                  </div>
                ) : (
                  insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-4 text-sm leading-relaxed text-indigo-50/90 group/item">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400 opacity-80 group-hover/item:scale-110 transition-transform" />
                      <p>{insight}</p>
                    </div>
                  ))
                )}
                <button 
                  onClick={fetchInsights}
                  disabled={isInsightLoading}
                  className="mt-6 w-full py-3 bg-white text-indigo-900 rounded-2xl text-sm font-bold shadow-xl hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInsightLoading ? <Zap size={16} className="animate-spin" /> : <Zap size={16} />}
                  Analyze Live Data
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          </div>

          <div className={`p-8 rounded-3xl border shadow-sm ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`font-bold text-lg mb-6 ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Persona Simulation</h3>
            <div className="space-y-4">
              {users.slice(0, 3).map((user) => (
                <button 
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    pushNotification(`Session context updated to: ${user.name}`);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    currentUser.id === user.id 
                      ? 'bg-indigo-50/50 border-indigo-200' 
                      : settings.darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="text-left flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className={`text-sm font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  {currentUser.id === user.id && <Check size={16} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`rounded-[2rem] shadow-sm border overflow-hidden ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`p-8 border-b ${settings.darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Globe size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Enterprise Configuration</h3>
              <p className="text-slate-500 text-sm">Control global system parameters and brand identity.</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Display Name</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                className={`w-full px-5 py-3 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                  settings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Regional Setting</label>
              <select className={`w-full px-5 py-3 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                settings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}>
                <option>Global (UTC+0)</option>
                <option>Middle East (AST)</option>
                <option>North America (EST)</option>
              </select>
            </div>
          </div>
          
          <div className={`flex items-center justify-between p-6 rounded-[2rem] border ${
            settings.darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
          }`}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Maintenance Protocol</p>
                <p className="text-sm text-slate-500">Enable site-wide lockout for core system updates.</p>
              </div>
            </div>
            <Toggle 
              enabled={settings.maintenanceMode} 
              onChange={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} 
            />
          </div>
        </div>
      </div>

      <div className={`rounded-[2rem] shadow-sm border overflow-hidden ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`p-8 border-b ${settings.darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <Lock size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Security Enforcement</h3>
              <p className="text-slate-500 text-sm">Advanced authentication and access control.</p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between group">
            <div>
              <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Hardware 2FA Requirement</p>
              <p className="text-sm text-slate-500">Enforce physical key authentication for all Administrators.</p>
            </div>
            <Toggle 
              enabled={settings.twoFactorAuth} 
              onChange={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})} 
            />
          </div>
          <div className={`h-px ${settings.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Auto-Backup Engine</p>
              <p className="text-sm text-slate-500">Incremental backups every 6 hours to AWS Glacier.</p>
            </div>
            <Toggle enabled={settings.autoBackup} onChange={() => setSettings({...settings, autoBackup: !settings.autoBackup})} />
          </div>
        </div>
      </div>

      <div className={`rounded-[2rem] shadow-sm border overflow-hidden ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`p-8 border-b ${settings.darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Monitor size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>UI Personalization</h3>
            </div>
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => setSettings({...settings, darkMode: false})}
            className={`flex flex-col gap-5 p-8 rounded-3xl border-2 transition-all text-left group ${
              !settings.darkMode ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${!settings.darkMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Sun size={24} />
            </div>
            <div>
              <p className={`font-bold ${settings.darkMode ? 'text-slate-400' : 'text-slate-900'}`}>High Clarity Mode</p>
              <p className="text-xs text-slate-500 mt-1">Maximum readability for high-light environments.</p>
            </div>
          </button>
          <button 
            onClick={() => setSettings({...settings, darkMode: true})}
            className={`flex flex-col gap-5 p-8 rounded-3xl border-2 transition-all text-left group ${
              settings.darkMode ? 'border-indigo-600 bg-indigo-900/10' : 'border-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${settings.darkMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Moon size={24} />
            </div>
            <div>
              <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Cyber Onyx Theme</p>
              <p className="text-xs text-slate-500 mt-1">Deep contrast dark mode optimized for developers.</p>
            </div>
          </button>
        </div>
      </div>
      
      <div className="flex justify-end gap-5 pt-4">
        <button className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Discard All</button>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-10 py-3.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          {isSaving ? <Check size={18} className="animate-pulse" /> : <Save size={18} />}
          {isSaving ? 'Synchronizing...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-all duration-500 ${settings.darkMode ? 'bg-slate-950 text-slate-200' : 'bg-[#fcfdfe] text-slate-900'}`}>
      {/* Dynamic Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 border-r ${
        settings.darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-100'
      } ${sidebarOpen ? 'w-64' : 'w-24'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl shadow-indigo-600/40 relative">
              <Hexagon size={28} className="fill-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            {sidebarOpen && <span className={`font-black text-2xl tracking-tighter transition-all ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>NEXUS</span>}
          </div>

          <nav className="flex-1 px-4 space-y-3 mt-6">
            <SidebarItem 
              icon={<LayoutDashboard size={22} />} 
              label={sidebarOpen ? "Dashboard" : ""} 
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem 
              icon={<Users size={22} />} 
              label={sidebarOpen ? "Human Capital" : ""} 
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            />
            <SidebarItem 
              icon={<ShieldCheck size={22} />} 
              label={sidebarOpen ? "Access Control" : ""} 
              active={activeTab === 'roles'}
              onClick={() => setActiveTab('roles')}
              disabled={!hasPermission('edit_roles')}
            />
            <SidebarItem 
              icon={<BarChart3 size={22} />} 
              label={sidebarOpen ? "Global BI" : ""} 
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
            />
          </nav>

          <div className="p-6 border-t border-slate-100/10">
            <SidebarItem 
              icon={<Settings size={22} />} 
              label={sidebarOpen ? "Admin Settings" : ""} 
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')} 
            />
            <SidebarItem 
              icon={<LogOut size={22} />} 
              label={sidebarOpen ? "Terminate" : ""} 
              onClick={() => {
                if(confirm('Terminate current session?')) {
                   pushNotification('Session terminated. Re-authenticating...');
                   setTimeout(() => window.location.reload(), 1000);
                }
              }} 
            />
          </div>
        </div>
      </aside>

      {/* Primary Workspace */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-24'}`}>
        <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-10 py-6 flex items-center justify-between transition-colors ${
          settings.darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-white/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-500 transition-colors border border-transparent hover:border-slate-200">
              <Menu size={20} />
            </button>
            <div>
              <h2 className={`text-2xl font-black capitalize tracking-tight ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>{activeTab}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Internal Operations Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200"
              >
                <Bell size={22} />
                {notifications.length > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-bounce"></span>
                )}
              </button>
              {isNotificationOpen && (
                <div className={`absolute right-0 mt-5 w-96 rounded-[2.5rem] shadow-2xl border p-4 z-[60] animate-in slide-in-from-top-4 ${
                  settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`p-4 border-b flex justify-between items-center mb-2 ${settings.darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className="font-black text-sm uppercase tracking-widest">Feed</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-indigo-500 font-black uppercase hover:underline">Flush</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="p-12 text-center text-sm text-slate-400 italic font-medium">Clear sky. No active logs.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-[1.5rem] transition-colors border ${
                          settings.darkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-50'
                        }`}>
                          <p className="text-xs font-bold leading-tight">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-tighter">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className={`flex items-center gap-4 pl-6 border-l ${settings.darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{currentUser.name}</p>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{currentUser.role}</p>
              </div>
              <div className="relative">
                <img 
                  src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=6366f1&color=fff`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-2xl border-2 border-indigo-500/20 shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10">
          {settings.maintenanceMode && activeTab !== 'settings' ? (
            <div className="flex flex-col items-center justify-center py-40 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-8 animate-pulse">
                <AlertCircle size={48} />
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-4 text-center">System in Maintenance</h1>
              <p className="text-slate-500 max-w-md text-center font-medium">Operations are currently halted for protocol synchronization. Please contact Enterprise Support.</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'settings' && renderSettings()}

              {activeTab === 'users' && (
                <div className={`rounded-[2.5rem] shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ${
                  settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <div className={`p-8 border-b flex flex-col md:flex-row gap-6 justify-between items-center ${
                    settings.darkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" placeholder="Global user search..." value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-12 pr-6 py-3 border rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${
                            settings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>
                      <select 
                        value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}
                        className={`border rounded-2xl text-sm px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                           settings.darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <option value="All">All Groups</option>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {hasPermission('manage_users') && (
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                      >
                        <Plus size={20} /> Deploy Account
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className={`text-[10px] font-black uppercase tracking-[0.2em] ${settings.darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                        <tr>
                          <th className="px-8 py-5">Node Identity</th>
                          <th className="px-8 py-5">Access Level</th>
                          <th className="px-8 py-5">Organizational Unit</th>
                          <th className="px-8 py-5">Connectivity</th>
                          <th className="px-8 py-5 text-right">Operations</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm ${settings.darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className={`${settings.darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'} transition-colors`}>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-10 h-10 rounded-2xl" />
                                <div><p className="font-bold">{user.name}</p><p className="text-xs text-slate-500 font-medium">{user.email}</p></div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                              }`}>{user.role}</span>
                            </td>
                            <td className="px-8 py-6 text-slate-500 font-semibold">{user.department}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
                                <span className="font-bold">{user.status}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex gap-2 justify-end">
                                 <button className="p-2.5 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all" title="Edit Parameters">
                                   <Edit2 size={16} />
                                 </button>
                                 {hasPermission('manage_users') && (
                                   <button onClick={() => deleteUser(user.id)} className="p-2.5 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-all" title="Wipe Account">
                                     <Trash2 size={16} />
                                   </button>
                                 )}
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6">
                  <div className={`rounded-[2.5rem] shadow-sm border p-10 ${
                    settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    <h3 className="text-xl font-black mb-8 tracking-tight uppercase">Protocol Authorization</h3>
                    <div className="space-y-8">
                      {roles.map((config) => (
                        <div key={config.role} className={`p-8 rounded-[2rem] border transition-all hover:shadow-xl ${
                          settings.darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
                        }`}>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-4 h-4 rounded-full shadow-lg ${config.color}`}></div>
                              <h4 className="font-black text-lg">{config.role} Role</h4>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ALL_PERMISSIONS.map((perm) => (
                              <button 
                                key={perm.id}
                                onClick={() => {
                                  setRoles(prev => prev.map(r => r.role === config.role ? {
                                    ...r,
                                    permissions: r.permissions.includes(perm.id) 
                                      ? r.permissions.filter(p => p !== perm.id) 
                                      : [...r.permissions, perm.id]
                                  } : r));
                                  pushNotification(`Revised ${config.role} access scope.`);
                                }}
                                className={`flex items-center gap-4 p-3 rounded-2xl border text-left transition-all group/perm ${
                                  config.permissions.includes(perm.id)
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-[1.02]'
                                    : `border-slate-200 hover:border-slate-300 ${settings.darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'}`
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                  config.permissions.includes(perm.id) ? 'bg-white text-indigo-600 border-white' : 'border-slate-300'
                                }`}>
                                  {config.permissions.includes(perm.id) && <Check size={14} strokeWidth={4} />}
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider">{perm.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-[2.5rem] shadow-sm border p-10 ${
                    settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3 uppercase">
                      <AlertCircle size={24} className="text-indigo-600" /> High-Level Audit
                    </h3>
                    <div className="space-y-4">
                      {notifications.map((log, i) => (
                        <div key={i} className={`flex gap-5 p-6 rounded-[2rem] border transition-all ${
                           settings.darkMode ? 'border-slate-800 hover:border-slate-700' : 'border-slate-50 hover:border-slate-100'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            {i % 2 === 0 ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-snug">{log.text}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">{log.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className={`rounded-[2.5rem] shadow-sm border p-10 ${
                    settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight">Intelligence Node Analysis</h2>
                        <p className="text-slate-500 font-medium mt-2">Computing telemetry for {users.length} connected corporate nodes.</p>
                      </div>
                      <div className={`flex gap-2 p-1.5 rounded-2xl ${settings.darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {['Realtime', 'Legacy', 'Archive'].map(range => (
                          <button key={range} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            range === 'Realtime' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'
                          }`}>
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[{n:'Mon',a:400,b:240},{n:'Tue',a:300,b:139},{n:'Wed',a:200,b:980},{n:'Thu',a:278,b:390},{n:'Fri',a:189,b:480},{n:'Sat',a:239,b:380},{n:'Sun',a:349,b:430}]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.darkMode ? "#1e293b" : "#f1f5f9"} />
                          <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                          <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', background: settings.darkMode ? '#0f172a' : '#fff'}} />
                          <Line type="monotone" dataKey="a" stroke="#6366f1" strokeWidth={5} dot={{r: 8, fill: '#fff', strokeWidth: 4, stroke: '#6366f1'}} activeDot={{r: 12, strokeWidth: 0}} />
                          <Line type="monotone" dataKey="b" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="8 8" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Persistence Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Provision New Account">
        <form onSubmit={handleAddUser} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Full Name</label>
            <input 
              required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              placeholder="Full Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email Node</label>
            <input 
              required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
              placeholder="enterprise@nexus.corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Tier</label>
              <select 
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
              >
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dept. Unit</label>
              <select 
                value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
              >
                {['Engineering', 'Product', 'Marketing', 'Executive', 'Design'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-6 flex gap-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Abort</button>
            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">Authorize Node</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
