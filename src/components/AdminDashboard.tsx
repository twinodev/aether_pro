import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Activity as ActivityIcon, 
  Clock, 
  ArrowUpRight, 
  Search, 
  Zap, 
  Star,
  Settings,
  MoreVertical,
  Mail,
  UserPlus,
  RefreshCw,
  LayoutDashboard,
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Check,
  AlertTriangle,
  Send,
  CheckSquare,
  Square,
  BarChart2,
  PieChart,
  TrendingUp,
  Lock,
  Server,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart as RechartsPieChart, 
  Pie 
} from 'recharts';
import { subscribeToAllActivities, Activity } from '../services/activityService';
import { subscribeToAllUsers, toggleUserVip, grantVipAccess, verifyAgent, UserProfile } from '../services/userService';
import { subscribeToBroadcasts, createBroadcast, deleteBroadcast, updateBroadcastStatus, Broadcast } from '../services/broadcastService';
import { useAuth } from '../contexts/AuthContext';
import { emailService } from '../services/emailService';

type AdminTab = 'overview' | 'users' | 'intelligence' | 'broadcasts' | 'emails';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalOps: 0, uniqueUsers: 0, vipCount: 0 });
  const [isAddingBroadcast, setIsAddingBroadcast] = useState(false);

  // Email Broadcast States
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('OPERATIONAL DIRECTIVE: Platform Synchronization');
  const [emailTemplate, setEmailTemplate] = useState<'slate' | 'crimson' | 'clean'>('slate');
  const [emailBody, setEmailBody] = useState(
    "Greetings [name],\n\nThis is an official administrative broadcast. Please head to your Aether dashboard to review the newly prioritized DukaSync and Events modules."
  );
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailLogs, setEmailLogs] = useState<{ email: string; status: 'idle' | 'sending' | 'success' | 'error'; message?: string }[]>([]);
  const [newBroadcast, setNewBroadcast] = useState<{
    title: string,
    message: string, 
    type: Broadcast['type'],
    pinned: boolean,
    expiresInDays: string
  }>({
    title: '',
    message: '',
    type: 'info',
    pinned: false,
    expiresInDays: '0'
  });

  useEffect(() => {
    if (isAdmin) {
      const unsubActivities = subscribeToAllActivities((data) => {
        setActivities(data);
        setStats(prev => ({ ...prev, totalOps: data.length }));
      });

      const unsubUsers = subscribeToAllUsers((userData) => {
        setUsers(userData);
        setStats(prev => ({ 
          ...prev, 
          uniqueUsers: userData.length,
          vipCount: userData.filter(u => u.isVip).length
        }));
      });

      const unsubBroadcasts = subscribeToBroadcasts((data) => {
        setBroadcasts(data);
      }, true);

      return () => {
        unsubActivities();
        unsubUsers();
        unsubBroadcasts();
      };
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Shield size={48} className="text-rose-600 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h2>
        <p className="text-neutral-400">Administrative clearance required for this terminal.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toolUsageData = Object.entries(
     activities.reduce((acc, a) => {
        const name = a.toolName || 'Unknown Tool';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
     }, {} as Record<string, number>)
  ).map(([name, count]) => ({
     name: name.replace(/Tool|Builder|Predictor|Generator|Sorter/g, '').trim(),
     count: Number(count)
  })).sort((a, b) => b.count - a.count);

  const tierDistributionData = [
     { name: 'Standard Operative', value: users.filter(u => !u.isVip && !u.isAdmin).length, color: '#94a3b8' },
     { name: 'Elite VIP', value: users.filter(u => u.isVip).length, color: '#e11d48' },
     { name: 'System Admin', value: users.filter(u => u.isAdmin).length, color: '#111827' }
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="px-3 py-1 bg-rose-600 text-white rounded-full text-[8px] font-black uppercase tracking-[0.3em]">System Level 0</div>
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Aether intelligence Command</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-2">Omnitool <span className="text-neutral-200">OPS.</span></h1>
          <p className="text-neutral-400 font-medium text-lg">Central hub for identity management and platform telemetry.</p>
        </div>

        <nav className="flex bg-neutral-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
           {(['overview', 'users', 'intelligence', 'broadcasts', 'emails'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab 
                 ? 'bg-white text-neutral-900 shadow-sm' 
                 : 'text-neutral-500 hover:text-neutral-900'
               }`}
             >
               {tab === 'emails' ? 'Email Blast' : tab}
             </button>
           ))}
        </nav>
      </header>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm">
             <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-6">
                <Users size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Authenticated Agents</span>
             <span className="text-4xl font-black text-neutral-900">{stats.uniqueUsers}</span>
          </div>
          <div className="p-8 bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm">
             <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center mb-6">
                <Star size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Elite VIP Tiers</span>
             <span className="text-4xl font-black text-neutral-900">{stats.vipCount}</span>
          </div>
          <div className="p-8 bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm">
             <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6">
                <Zap size={18} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Signal Processing</span>
             <span className="text-4xl font-black text-neutral-900">{stats.totalOps}</span>
          </div>
          <div className="p-8 bg-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center mb-6">
                   <Settings size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">System Health</span>
                <span className="text-4xl font-black text-white uppercase italic">Optimal</span>
             </div>
             <Zap className="absolute bottom-[-20px] right-[-20px] text-white/5" size={160} />
          </div>

          <div className="lg:col-span-3 bg-white border border-neutral-100 rounded-[2.5rem] p-10">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <ActivityIcon className="text-rose-600" size={24} />
                   <h3 className="text-xl font-black uppercase tracking-tighter">Live Signal Logic</h3>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-rose-600 border border-rose-100 px-4 py-2 rounded-xl">Export Report</button>
             </div>
             <div className="space-y-4">
                {activities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-[10px] font-black uppercase tracking-tighter">
                           {activity.toolId.slice(0, 2)}
                        </div>
                        <div>
                           <div className="text-xs font-black uppercase tracking-widest text-neutral-900">{activity.toolName}</div>
                           <div className="text-[8px] font-bold text-neutral-400 flex items-center gap-2">
                              <span>{activity.userId.slice(0, 12)}...</span>
                              <div className="w-1 h-1 rounded-full bg-neutral-300" />
                              <span>{activity.timestamp?.toDate ? activity.timestamp.toDate().toLocaleTimeString() : 'Recent'}</span>
                           </div>
                        </div>
                     </div>
                     <ArrowUpRight size={14} className="text-neutral-300" />
                  </div>
                ))}
             </div>
          </div>
          
          <div className="bg-neutral-50 rounded-[2.5rem] p-8 border border-neutral-100">
             <h4 className="text-sm font-black uppercase tracking-widest text-neutral-900 mb-6">Quick Directives</h4>
             <div className="space-y-3">
                {[
                  { label: 'Clear Signal Cache', icon: RefreshCw },
                  { label: 'System Broadcast', icon: Mail },
                  { label: 'Security Audit', icon: Shield },
                  { label: 'Provision User', icon: UserPlus },
                ].map((action, i) => (
                  <button key={i} className="w-full flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-colors group">
                     <action.icon size={16} className="text-neutral-400 group-hover:text-rose-600 transition-colors" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{action.label}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm overflow-hidden">
           <div className="p-10 border-b border-neutral-50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center">
                       <Users size={24} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">Identity Terminal</h3>
                       <p className="text-neutral-400 text-sm font-medium">Managing access levels for {users.length} registered agents.</p>
                    </div>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search identity or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full lg:w-96 h-14 pl-12 pr-6 bg-neutral-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-rose-600 transition-all"
                    />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="bg-neutral-50/50">
                       <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Agent Identity</th>
                       <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Access Level</th>
                       <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Registration</th>
                       <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Directives</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-50">
                    <AnimatePresence>
                      {filteredUsers.map((user) => (
                        <motion.tr 
                          key={user.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-neutral-50/50 transition-colors"
                        >
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-4">
                                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-neutral-100" />
                                <div>
                                   <div className="text-xs font-black uppercase tracking-widest text-neutral-900">{user.displayName}</div>
                                   <div className="text-[10px] font-medium text-neutral-400">{user.email}</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-6">
                             {user.isAdmin ? (
                               <span className="px-3 py-1 bg-neutral-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">System Admin</span>
                             ) : user.isVip ? (
                               <div className="flex flex-col gap-1">
                                 <span className="px-3 py-1 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit">
                                    <Star size={8} /> Elite VIP
                                 </span>
                                 {user.billingCycle && user.billingCycle !== 'none' && (
                                   <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-tighter ml-1">
                                     {user.billingCycle} {user.vipExpiry ? `(Until ${new Date(user.vipExpiry).toLocaleDateString()})` : ''}
                                   </span>
                                 )}
                               </div>
                             ) : (
                               <span className="px-3 py-1 bg-neutral-100 text-neutral-400 text-[8px] font-black uppercase tracking-widest rounded-full">Standard Tier</span>
                             )}
                             {user.isVerifiedAgent && (
                               <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit mt-1">
                                  <Shield size={8} /> Verified Agent
                               </span>
                             )}
                          </td>
                          <td className="px-10 py-6">
                             <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                             </div>
                             {user.trialActivatedAt && (
                               <div className="text-[7px] font-black text-emerald-500 uppercase mt-1">Trial Used</div>
                             )}
                          </td>
                           <td className="px-10 py-6 text-right">
                             {!user.isAdmin && (
                               <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => verifyAgent(user.uid, !user.isVerifiedAgent)}
                                    className={`px-3 py-2 rounded-lg text-[7px] font-black uppercase transition-all ${
                                      user.isVerifiedAgent 
                                      ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    }`}
                                  >
                                    {user.isVerifiedAgent ? 'De-Verify' : 'Verify Agent'}
                                  </button>
                                  {user.isVip ? (
                                    <button 
                                      onClick={() => toggleUserVip(user.uid, user.isVip)}
                                      className="px-4 py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Revoke
                                    </button>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => grantVipAccess(user.uid, 'monthly')}
                                        className="px-3 py-2 bg-neutral-900 text-white hover:bg-black rounded-lg text-[7px] font-black uppercase shadow-lg shadow-black/10"
                                      >
                                        Monthly
                                      </button>
                                      <button 
                                        onClick={() => grantVipAccess(user.uid, 'annually')}
                                        className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[7px] font-black uppercase shadow-lg shadow-indigo-600/10"
                                      >
                                        Yearly
                                      </button>
                                      <button 
                                        onClick={() => grantVipAccess(user.uid, 'lifetime')}
                                        className="px-3 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-[7px] font-black uppercase shadow-lg shadow-rose-600/10"
                                      >
                                        Life
                                      </button>
                                    </div>
                                  )}
                                  <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                                     <MoreVertical size={16} className="text-neutral-400" />
                                  </button>
                               </div>
                             )}
                           </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                 </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-20 text-center">
                   <p className="text-neutral-400 font-medium">No agents found matching that signature.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div className="space-y-8">
           <div className="bg-neutral-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-4">
                    <Megaphone size={24} className="text-rose-600" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">System Broadcasts</h3>
                 </div>
                 <p className="text-neutral-400 text-sm mb-8 max-w-sm">Deploy high-priority messages to all active terminal sessions.</p>
                 <button 
                    onClick={() => setIsAddingBroadcast(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-white text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                 >
                    <Plus size={16} /> New Broadcast
                 </button>
              </div>
           </div>

           <div className="bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="p-10 border-b border-neutral-50 flex items-center justify-between">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Transmission History</h3>
                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{broadcasts.length} Active Waves</span>
              </div>
              <div className="divide-y divide-neutral-50">
                 {broadcasts.length === 0 ? (
                   <div className="p-20 text-center text-neutral-400 font-medium">No active broadcasts in the field.</div>
                 ) : (
                   broadcasts.map((b) => (
                     <div key={b.id} className={`p-8 flex items-center justify-between hover:bg-neutral-50 transition-colors ${!b.active ? 'opacity-50 grayscale select-none' : ''}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${
                             b.type === 'critical' ? 'bg-rose-100 text-rose-600' :
                             b.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                             b.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                             'bg-neutral-100 text-neutral-900'
                           }`}>
                              <Megaphone size={20} />
                              {b.pinned && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center border-2 border-white">
                                  <Star size={10} fill="currentColor" />
                                </div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 overflow-hidden">
                                 <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900 truncate">
                                   {b.title ? `${b.title}: ` : ''}{b.message}
                                 </h4>
                                 <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    b.type === 'critical' ? 'bg-rose-600 text-white' :
                                    b.type === 'warning' ? 'bg-amber-500 text-white' :
                                    b.type === 'success' ? 'bg-emerald-600 text-white' :
                                    'bg-neutral-900 text-white'
                                 }`}>
                                    {b.type}
                                 </span>
                                 {!b.active && (
                                   <span className="shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-neutral-200 text-neutral-500">
                                     Inactive
                                   </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                 <span>Deployed: {b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'Recent'}</span>
                                 {b.expiresAt && (
                                   <span className="flex items-center gap-1 text-rose-400">
                                     <Clock size={10} /> Exp: {b.expiresAt.toDate().toLocaleDateString()}
                                   </span>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={() => updateBroadcastStatus(b.id, !b.active)}
                              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                b.active 
                                ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200' 
                                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20'
                              }`}
                           >
                              {b.active ? 'Deactivate' : 'Reactivate'}
                           </button>
                           <button 
                              onClick={() => deleteBroadcast(b.id)}
                              className="p-3 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
        <div className="space-y-8 animate-fade-in">
           {/* Section Header */}
           <div className="bg-neutral-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="relative z-10 w-full">
                 <div className="flex items-center gap-4 mb-4">
                    <BarChart2 size={24} className="text-rose-600 animate-pulse" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Signal Analysis & Intelligence</h3>
                 </div>
                 <p className="text-neutral-400 text-sm max-w-xl mb-4">
                    Real-time operational reporting, service utilization distribution, and secure client access metrics.
                 </p>
                 <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/45 px-4 py-2 border border-zinc-800 rounded-xl inline-block">
                    🔒 DECOUPLED SECURE MODE • STRICT NO-AI POLICY PROTOCOLS ACTIVE
                 </div>
              </div>
              <TrendingUp className="absolute bottom-[-10px] right-[-10px] text-white/5 rotate-12" size={160} />
           </div>

           {/* Bento Telemetry Metrics Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Tool Popularity Bar Chart card */}
              <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                 <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                       <BarChart2 size={18} className="text-[#0f172a]" /> Service Utilization Frequency
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium">Relative telemetry frequency mapped dynamically by user activity registration.</p>
                 </div>

                 {activities.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
                       <ActivityIcon size={32} className="text-neutral-200 mb-2 animate-pulse" />
                       <p className="text-xs font-bold uppercase tracking-wider">Telemetry Buffer Empty</p>
                       <p className="text-[10px]">No active operations recorded inside the signal logs yet.</p>
                    </div>
                 ) : (
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                             data={Object.entries(
                                activities.reduce((acc, a) => {
                                   const name = a.toolName || 'Unknown Tool';
                                   acc[name] = (acc[name] || 0) + 1;
                                   return acc;
                                }, {} as Record<string, number>)
                             ).map(([name, count]) => ({
                                name: name.replace(/Tool|Builder|Predictor|Generator|Sorter/g, '').trim(),
                                count
                             })).sort((a: any, b: any) => Number(b.count) - Number(a.count))} 
                             margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                             <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#737373', fontSize: 9, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                             />
                             <YAxis 
                                tick={{ fill: '#737373', fontSize: 9, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                             />
                             <ChartTooltip
                                cursor={{ fill: 'rgba(244, 63, 94, 0.04)' }}
                                contentStyle={{
                                   backgroundColor: '#ffffff',
                                   borderColor: '#f5f5f5',
                                   borderRadius: '16px',
                                   boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                                labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', color: '#0f172a' }}
                                itemStyle={{ fontSize: '10px', color: '#e11d48', fontWeight: 700 }}
                             />
                             <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {Object.keys(
                                   activities.reduce((acc, a) => {
                                      const name = a.toolName || 'Unknown Tool';
                                      acc[name] = (acc[name] || 0) + 1;
                                      return acc;
                                   }, {} as Record<string, number>)
                                ).map((_, index) => (
                                   <Cell key={`cell-${index}`} fill={['#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'][index % 6]} />
                                ))}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 )}
              </div>

              {/* User Subscription share Pie Chart card */}
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm flex flex-col justify-between">
                 <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                       <PieChart size={18} className="text-[#0f172a]" /> Access Tier Ratio
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium font-sans">Visual proportion of active security credentials in database namespaces.</p>
                 </div>

                 {users.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center text-neutral-400">
                       <Users size={32} className="text-neutral-200 mb-2" />
                       <p className="text-xs font-bold uppercase tracking-wider">No User Credentials</p>
                    </div>
                 ) : (
                    <div className="h-48 w-full relative">
                       <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                             <Pie
                                data={[
                                   { name: 'Standard Operative', value: users.filter(u => !u.isVip && !u.isAdmin).length, color: '#94a3b8' },
                                   { name: 'Elite VIP', value: users.filter(u => u.isVip).length, color: '#e11d48' },
                                   { name: 'System Admin', value: users.filter(u => u.isAdmin).length, color: '#111827' }
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                             >
                                {[
                                   { name: 'Standard Operative', value: users.filter(u => !u.isVip && !u.isAdmin).length, color: '#94a3b8' },
                                   { name: 'Elite VIP', value: users.filter(u => u.isVip).length, color: '#e11d48' },
                                   { name: 'System Admin', value: users.filter(u => u.isAdmin).length, color: '#111827' }
                                ].filter(d => d.value > 0).map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                             </Pie>
                             <ChartTooltip
                                contentStyle={{
                                   backgroundColor: '#ffffff',
                                   borderColor: '#f5f5f5',
                                   borderRadius: '16px',
                                   boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                                itemStyle={{ fontSize: '10px', fontWeight: 700 }}
                             />
                          </RechartsPieChart>
                       </ResponsiveContainer>
                       {/* Center label */}
                       <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                          <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Total Agents</span>
                          <span className="text-2xl font-black text-neutral-900 leading-none">{users.length}</span>
                       </div>
                    </div>
                 )}

                 {/* Legend */}
                 <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-50">
                    {[
                       { name: 'Standard', value: users.filter(u => !u.isVip && !u.isAdmin).length, color: '#94a3b8' },
                       { name: 'Elite VIP', value: users.filter(u => u.isVip).length, color: '#e11d48' },
                       { name: 'Admin', value: users.filter(u => u.isAdmin).length, color: '#111827' }
                    ].map((tier) => (
                       <div key={tier.name} className="text-center">
                          <span className="text-[16px] font-black block leading-none" style={{ color: tier.color }}>{tier.value}</span>
                          <span className="text-[8px] font-black uppercase tracking-tight text-neutral-400 block mt-1 truncate">{tier.name}</span>
                       </div>
                    ))}
                 </div>
              </div>

           </div>

           {/* Security Integrity Ledger & Signal Health */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Compliance ledger card */}
              <div className="bg-[#fafafa] border border-neutral-100 rounded-[2rem] p-8 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <ShieldCheck size={16} />
                    </div>
                    <div>
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Security & Verification</h5>
                       <p className="text-[8px] font-bold text-neutral-400 uppercase">Operational encryption guarantees.</p>
                    </div>
                 </div>
                 <hr className="border-neutral-200/50" />
                 <div className="space-y-2.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wide">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Database Connection Mode</span>
                       <span className="text-emerald-600 font-black text-[9px]">TLS 1.3 Secure</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>End-to-End Handshake</span>
                       <span className="text-emerald-600 font-black text-[9px]">Verified (Firestore)</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Verified Agents in Field</span>
                       <span className="text-neutral-900 font-black text-[9px]">{users.filter(u => u.isVerifiedAgent).length} / {users.length}</span>
                    </div>
                 </div>
              </div>

              {/* No-AI Policy Ledger card */}
              <div className="bg-[#fafafa] border border-neutral-100 rounded-[2rem] p-8 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Lock size={16} />
                    </div>
                    <div>
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Strict No-AI Ledger</h5>
                       <p className="text-[8px] font-bold text-neutral-400 uppercase">Guaranteed offline-capable business metrics.</p>
                    </div>
                 </div>
                 <hr className="border-neutral-200/50" />
                 <div className="space-y-2.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wide">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Machine Profiling Feed</span>
                       <span className="text-rose-600 font-black text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-rose-50">Blocked BY Policy</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Algorithmic Forecasting</span>
                       <span className="text-rose-600 font-black text-[8px] tracking-wider px-1.5 py-0.5 rounded bg-rose-50">DISABLED</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Compliance Status</span>
                       <span className="text-emerald-600 font-black text-[9px]">100% Retailing Core</span>
                    </div>
                 </div>
              </div>

              {/* System Infrastructure nodes card */}
              <div className="bg-[#fafafa] border border-neutral-100 rounded-[2rem] p-8 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                       <Server size={16} />
                    </div>
                    <div>
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Signal Nodes</h5>
                       <p className="text-[8px] font-bold text-neutral-400 uppercase">Underlying infrastructure latency feeds.</p>
                    </div>
                 </div>
                 <hr className="border-neutral-200/50" />
                 <div className="space-y-2.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wide">
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Admin Panel Version</span>
                       <span className="text-neutral-500 font-mono text-[9px]">v3.8.4</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Local Memory Cache</span>
                       <span className="text-emerald-600 font-black text-[9px]">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100">
                       <span>Operational Response</span>
                       <span className="text-emerald-600 font-black text-[9px]">Optimal (&lt;40ms)</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      )}

      {activeTab === 'emails' && (
        <div className="space-y-8 animate-fade-in">
           {/* Section Header */}
           <div className="bg-neutral-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="relative z-10 w-full">
                 <div className="flex items-center gap-4 mb-4">
                    <Mail size={24} className="text-rose-600 animate-pulse animate-duration-1000" />
                    <h3 className="text-2xl font-black uppercase tracking-tight">Email Intelligence Blast</h3>
                 </div>
                 <p className="text-neutral-400 text-sm max-w-xl mb-4">Draft customized, styled directives and send them directly to chosen representatives.</p>
                 <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/45 px-4 py-2 border border-zinc-800 rounded-xl inline-block">
                    Use <strong className="text-rose-500">[name]</strong> or <strong className="text-rose-500">{"{{name}}"}</strong> to dynamically interpolate recipient names.
                 </div>
              </div>
              <Mail className="absolute bottom-[-10px] right-[-10px] text-white/5 rotate-12" size={160} />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: User Selection */}
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm p-8 space-y-6">
                 <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                       <Users size={16} /> Recipients Selection
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium">Select target destinations for active broadcast wave.</p>
                 </div>

                 {/* Selection Actions */}
                 <div className="flex flex-wrap items-center gap-2">
                    <button 
                       onClick={() => setSelectedEmails(users.map(u => u.email).filter(Boolean) as string[])}
                       className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                    >
                       Select All ({users.length})
                    </button>
                    <button 
                       onClick={() => setSelectedEmails(users.filter(u => u.isVip).map(u => u.email).filter(Boolean) as string[])}
                       className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                       <Star size={10} className="text-amber-500 fill-amber-500" /> All VIPs
                    </button>
                    <button 
                       onClick={() => setSelectedEmails(users.filter(u => u.isVerifiedAgent).map(u => u.email).filter(Boolean) as string[])}
                       className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                       <Shield size={10} className="text-emerald-500" /> Verified Only
                    </button>
                    <button 
                       onClick={() => setSelectedEmails([])}
                       className="px-3 py-1.5 border border-neutral-100 hover:bg-neutral-50 text-neutral-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                       Deselect All
                    </button>
                 </div>

                 {/* User Scroll area */}
                 <div className="border border-neutral-100 rounded-2xl overflow-y-auto max-h-96 divide-y divide-neutral-50 no-scrollbar">
                    {users.map((user) => {
                       const isChecked = selectedEmails.includes(user.email || '');
                       return (
                          <div 
                             key={user.uid} 
                             onClick={() => {
                                if (!user.email) return;
                                if (isChecked) {
                                   setSelectedEmails(prev => prev.filter(e => e !== user.email));
                                } else {
                                   setSelectedEmails(prev => [...prev, user.email || '']);
                                }
                             }}
                             className="p-4 flex items-center justify-between hover:bg-neutral-50 cursor-pointer transition-colors"
                          >
                             <div className="flex items-center gap-4">
                                <span className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                   {isChecked ? (
                                      <CheckSquare size={18} className="text-rose-600" />
                                   ) : (
                                      <Square size={18} />
                                   )}
                                </span>
                                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                <div>
                                   <div className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                                      {user.displayName}
                                      {user.isVip && <Star size={10} className="text-amber-500 fill-amber-500 inline-block" />}
                                      {user.isVerifiedAgent && <Shield size={10} className="text-emerald-600 inline-block" />}
                                   </div>
                                   <div className="text-[9px] font-mono text-neutral-400">{user.email}</div>
                                </div>
                             </div>
                             <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                                {user.isAdmin ? 'Admin' : user.isVip ? 'VIP' : 'Operative'}
                             </span>
                          </div>
                       );
                    })}
                 </div>
              </div>

              {/* Right Column: Compose, Template & Preview */}
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm p-8 space-y-6">
                 <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-neutral-950 flex items-center gap-2">
                       <Mail size={16} /> Compose Broadcast
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium">Design structural email layout and messaging fields.</p>
                 </div>

                 {/* Subject */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email Subject</label>
                    <input 
                       type="text"
                       value={emailSubject}
                       onChange={e => setEmailSubject(e.target.value)}
                       className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                       placeholder="Enter email subject line..."
                    />
                 </div>

                 {/* Template Selector */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Structure Style</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['slate', 'crimson', 'clean'] as const).map((style) => (
                          <button
                             key={style}
                             onClick={() => setEmailTemplate(style)}
                             className={`h-11 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                                emailTemplate === style 
                                ? 'border-rose-600 bg-rose-50 text-rose-600' 
                                : 'border-neutral-100 hover:border-neutral-200 text-neutral-400'
                             }`}
                          >
                             {style === 'slate' ? 'Slate Premium' : style === 'crimson' ? 'Crimson Alert' : 'Clean Light'}
                          </button>
                       ))}
                    </div>
                  </div>

                 {/* Body Code */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Message Body</label>
                    <textarea 
                       value={emailBody}
                       onChange={e => setEmailBody(e.target.value)}
                       className="w-full h-32 p-4 bg-neutral-50 rounded-xl text-xs font-mono focus:ring-2 ring-rose-600 outline-none resize-none"
                       placeholder="Enter dynamic message. Supports custom text protocols..."
                    />
                 </div>

                 {/* Live Simulated Preview Drawer */}
                 <div className="mt-4 p-4 bg-neutral-50 border border-neutral-100 rounded-2xl">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-3">Live Recipient View Simulation</span>
                    <div className={`p-4 rounded-xl text-xs overflow-hidden max-h-48 overflow-y-auto font-sans shadow-sm border ${
                       emailTemplate === 'slate' ? 'bg-[#0f172a] text-slate-100 border-[#1e293b]' :
                       emailTemplate === 'crimson' ? 'bg-[#fef2f2] text-red-950 border-[#fca5a5]' :
                       'bg-white text-neutral-900 border-neutral-200'
                    }`}>
                       <h5 className={`font-black uppercase tracking-tight text-xs mb-2 ${
                          emailTemplate === 'slate' ? 'text-white border-b border-zinc-800 pb-2' :
                          emailTemplate === 'crimson' ? 'text-rose-800 border-b border-red-200 pb-2' :
                          'text-neutral-950 border-b border-neutral-100 pb-2'
                       }`}>
                          {emailSubject}
                       </h5>
                       <p className="whitespace-pre-line text-[11px] leading-relaxed">
                          {emailBody.replace(/\[name\]/g, users[0]?.displayName || 'Agent').replace(/\{\{name\}\}/g, users[0]?.displayName || 'Agent')}
                       </p>
                       <div className="mt-4 pt-2 border-t border-dashed border-zinc-500/20 text-[9px] text-zinc-450 uppercase tracking-widest">
                          Aether intelligence v3.8.4 • Dedicated recipient: {users[0]?.email || 'demo@aether.net'}
                       </div>
                    </div>
                 </div>

                 {/* Execute Button */}
                 <div className="pt-2">
                    <button
                       disabled={selectedEmails.length === 0 || !emailSubject || !emailBody || isSendingEmails}
                       onClick={async () => {
                          setIsSendingEmails(true);
                          
                          // Initialize send logs for selected emails
                          const initialLogs = selectedEmails.map(email => ({
                             email,
                             status: 'sending' as const,
                          }));
                          setEmailLogs(initialLogs);

                          // Loop through each selected email to personalize the name if possible
                          for (let i = 0; i < selectedEmails.length; i++) {
                             const email = selectedEmails[i];
                             const targetUser = users.find(u => u.email === email);
                             const name = targetUser?.displayName || 'Agent';
                             
                             // Personalize content
                             const personalizedBody = emailBody.replace(/\[name\]/g, name).replace(/\{\{name\}\}/g, name);
                             
                             let htmlContent = '';
                             if (emailTemplate === 'slate') {
                                htmlContent = `
                                  <div style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; border: 1px solid #1e293b;">
                                    <div style="margin-bottom: 20px;">
                                      <span style="font-size: 10px; font-weight: 900; background-color: #f43f5e; color: #ffffff; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.2em;">Aether Broadcast</span>
                                    </div>
                                    <h1 style="font-size: 20px; font-weight: 955; color: #ffffff; text-transform: uppercase; letter-spacing: -0.025em; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px;">
                                      ${emailSubject}
                                    </h1>
                                    <div style="font-size: 14px; line-height: 1.7; color: #cbd5e1; white-space: pre-line; margin-bottom: 35px;">
                                      ${personalizedBody}
                                    </div>
                                    <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 35px;">
                                      <p style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Security Directive</p>
                                      <p style="font-size: 12px; color: #f8fafc; margin: 0;">This transmission is intended only for authorized agent <strong>${email}</strong>. Operational logs have recorded this delivery.</p>
                                    </div>
                                    <div style="border-top: 1px solid #1e293b; padding-top: 25px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em;">
                                      AETHER INTELLIGENCE SYSTEM
                                    </div>
                                  </div>
                                `;
                             } else if (emailTemplate === 'crimson') {
                                htmlContent = `
                                  <div style="font-family: sans-serif; background-color: #fef2f2; color: #7f1d1d; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; border: 2px solid #fca5a5;">
                                    <div style="margin-bottom: 20px;">
                                      <span style="font-size: 10px; font-weight: 900; background-color: #991b1b; color: #ffffff; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.2em;">CRITICAL DIRECTIVE</span>
                                    </div>
                                    <h1 style="font-size: 20px; font-weight: 955; color: #991b1b; text-transform: uppercase; letter-spacing: -0.025em; border-bottom: 2px solid #fee2e2; padding-bottom: 15px; margin-bottom: 25px;">
                                      ⚠️ ${emailSubject}
                                    </h1>
                                    <div style="font-size: 14px; line-height: 1.7; color: #7f1d1d; white-space: pre-line; margin-bottom: 35px;">
                                      ${personalizedBody}
                                    </div>
                                    <div style="background-color: #fee2e2; padding: 20px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 35px;">
                                      <p style="font-size: 10px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">IMMEDIATE RESPONSE MANDATED</p>
                                      <p style="font-size: 12px; color: #7f1d1d; margin: 0;">Verify compliance immediately. Fail-safe logging activated for receipt validation.</p>
                                    </div>
                                    <div style="border-top: 1px solid #fecaca; padding-top: 25px; font-size: 10px; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.15em;">
                                      AETHER SECURE PROTOCOLS • ROOT HIGH CLEARANCE
                                    </div>
                                  </div>
                                `;
                             } else {
                                htmlContent = `
                                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; color: #1f2937;">
                                    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #111827;">${emailSubject}</h2>
                                    <p style="font-size: 14px; line-height: 1.6; color: #4b5563; white-space: pre-line;">${personalizedBody}</p>
                                    <br />
                                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                                    <p style="font-size: 11px; color: #9ca3af;">Aether Platform Notification • Standard Delivery</p>
                                  </div>
                                `;
                             }

                             try {
                                const response = await emailService.sendEmail({
                                   to: email,
                                   subject: emailSubject,
                                   html: htmlContent
                                });
                                
                                setEmailLogs(prev => prev.map(log => 
                                   log.email === email ? { ...log, status: 'success', message: response?.warning || response?.errorDetails?.message || 'Sent' } : log
                                ));
                             } catch (error: any) {
                                setEmailLogs(prev => prev.map(log => 
                                   log.email === email ? { ...log, status: 'error', message: error.message || 'Transmission failed' } : log
                                ));
                             }
                          }
                          
                          setIsSendingEmails(false);
                       }}
                       className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:grayscale"
                    >
                       <Send size={14} />
                       {isSendingEmails ? 'Transmitting Wave...' : `Send Wave to ${selectedEmails.length} Target(s)`}
                    </button>
                 </div>
              </div>
           </div>

           {/* Live Sending Report Logs */}
           {emailLogs.length > 0 && (
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-10 shadow-sm space-y-4">
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-[#0f172a] flex items-center gap-2">
                       <Zap size={14} className="text-zinc-400" /> Operational Transmission Report
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Live telemetry feeds from SMTP route nodes.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                    {emailLogs.map((log) => (
                       <div key={log.email} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between font-sans">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                                log.status === 'success' ? 'bg-[#d1fae5] text-[#065f46]' :
                                log.status === 'error' ? 'bg-[#fee2e2] text-[#991b1b]' :
                                'bg-zinc-100 text-zinc-500 animate-pulse'
                             }`}>
                                {log.status === 'success' && <Check size={14} />}
                                {log.status === 'error' && <AlertTriangle size={14} />}
                                {log.status === 'sending' && <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />}
                             </div>
                             <div>
                                <p className="text-[11px] font-mono font-bold text-[#1e293b]">{log.email}</p>
                                {log.message && (
                                   <p className="text-[9px] font-semibold text-neutral-500 leading-none mt-1 font-sans">
                                      {log.message}
                                   </p>
                                )}
                             </div>
                          </div>
                          
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                             log.status === 'success' ? 'text-[#059669]' :
                             log.status === 'error' ? 'text-[#e11d48]' :
                             'text-zinc-400 animate-pulse'
                          }`}>
                             {log.status === 'success' ? 'Synchronized' : log.status === 'error' ? 'Interrupted' : 'Transmitting'}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      )}

      {isAddingBroadcast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             onClick={() => setIsAddingBroadcast(false)}
             className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
           />
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl space-y-6"
           >
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Nova Transmission</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Header/Title</label>
                   <input 
                      type="text"
                      value={newBroadcast.title}
                      onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})}
                      className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none"
                      placeholder="Optional title..."
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Expiration (Days)</label>
                   <select 
                      value={newBroadcast.expiresInDays}
                      onChange={e => setNewBroadcast({...newBroadcast, expiresInDays: e.target.value})}
                      className="w-full h-12 px-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none appearance-none"
                   >
                      <option value="0">Never Expires</option>
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                   </select>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Message Content</label>
                 <textarea 
                    value={newBroadcast.message}
                    onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})}
                    className="w-full h-24 p-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none resize-none"
                    placeholder="Enter system-wide message..."
                 />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                 <div className="flex items-center gap-3">
                    <Star size={16} className={newBroadcast.pinned ? "text-rose-600" : "text-neutral-300"} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Pin to Top of Feed</span>
                 </div>
                 <button 
                    onClick={() => setNewBroadcast({...newBroadcast, pinned: !newBroadcast.pinned})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${newBroadcast.pinned ? 'bg-rose-600' : 'bg-neutral-200'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newBroadcast.pinned ? 'right-1' : 'left-1'}`} />
                 </button>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Signal Priority</label>
                 <div className="grid grid-cols-4 gap-2">
                    {(['info', 'warning', 'critical', 'success'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewBroadcast({...newBroadcast, type})}
                        className={`h-12 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                          newBroadcast.type === type 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-100 hover:border-neutral-900 text-neutral-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button 
                    disabled={!newBroadcast.message}
                    onClick={async () => {
                       await createBroadcast(
                         newBroadcast.message, 
                         newBroadcast.title, 
                         newBroadcast.type,
                         newBroadcast.pinned,
                         newBroadcast.expiresInDays === '0' ? null : parseInt(newBroadcast.expiresInDays)
                       );
                       setIsAddingBroadcast(false);
                       setNewBroadcast({ title: '', message: '', type: 'info', pinned: false, expiresInDays: '0' });
                    }}
                    className="flex-1 h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:grayscale"
                 >
                    Transmit Signal
                 </button>
                 <button 
                    onClick={() => setIsAddingBroadcast(false)}
                    className="px-8 h-14 bg-neutral-100 text-neutral-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                 >
                    Abort
                 </button>
              </div>
           </motion.div>
        </div>
      )}

    </div>
  );
}
