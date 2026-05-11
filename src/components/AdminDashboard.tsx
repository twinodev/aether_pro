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
  Globe
} from 'lucide-react';
import { subscribeToAllActivities, Activity } from '../services/activityService';
import { subscribeToAllUsers, toggleUserVip, UserProfile } from '../services/userService';
import { subscribeToBroadcasts, createBroadcast, deleteBroadcast, Broadcast } from '../services/broadcastService';
import { useAuth } from '../contexts/AuthContext';

type AdminTab = 'overview' | 'users' | 'intelligence' | 'broadcasts';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalOps: 0, uniqueUsers: 0, vipCount: 0 });
  const [isAddingBroadcast, setIsAddingBroadcast] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<{message: string, type: Broadcast['type']}>({
    message: '',
    type: 'info'
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
      });

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
           {(['overview', 'users', 'intelligence', 'broadcasts'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab 
                 ? 'bg-white text-neutral-900 shadow-sm' 
                 : 'text-neutral-500 hover:text-neutral-900'
               }`}
             >
               {tab}
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
                               <span className="px-3 py-1 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 w-fit">
                                  <Star size={8} /> Elite VIP
                               </span>
                             ) : (
                               <span className="px-3 py-1 bg-neutral-100 text-neutral-400 text-[8px] font-black uppercase tracking-widest rounded-full">Standard Tier</span>
                             )}
                          </td>
                          <td className="px-10 py-6">
                             <div className="text-[10px] font-bold text-neutral-500 uppercase">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                             </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                             {!user.isAdmin && (
                               <div className="flex items-center justify-end gap-3">
                                  <button 
                                    onClick={() => toggleUserVip(user.uid, user.isVip)}
                                    className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                      user.isVip 
                                      ? 'border border-rose-100 text-rose-600 hover:bg-rose-50' 
                                      : 'bg-neutral-900 text-white hover:bg-rose-600'
                                    }`}
                                  >
                                    {user.isVip ? 'Revoke VIP' : 'Grant VIP'}
                                  </button>
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
                     <div key={b.id} className="p-8 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                             b.type === 'critical' ? 'bg-rose-100 text-rose-600' :
                             b.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                             b.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                             'bg-neutral-100 text-neutral-900'
                           }`}>
                              <Megaphone size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h4 className="text-sm font-black uppercase tracking-tight text-neutral-900">{b.message}</h4>
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    b.type === 'critical' ? 'bg-rose-600 text-white' :
                                    b.type === 'warning' ? 'bg-amber-500 text-white' :
                                    b.type === 'success' ? 'bg-emerald-600 text-white' :
                                    'bg-neutral-900 text-white'
                                 }`}>
                                    {b.type}
                                 </span>
                              </div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                 Deployed: {b.createdAt?.toDate ? b.createdAt.toDate().toLocaleString() : 'Recent'}
                              </p>
                           </div>
                        </div>
                        <button 
                           onClick={() => deleteBroadcast(b.id)}
                           className="p-3 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                   ))
                 )}
              </div>
           </div>
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
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Message Content</label>
                 <textarea 
                    value={newBroadcast.message}
                    onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})}
                    className="w-full h-32 p-4 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-2 ring-rose-600 outline-none resize-none"
                    placeholder="Enter system-wide message..."
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Signal Priority</label>
                 <div className="grid grid-cols-2 gap-2">
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
                    onClick={async () => {
                       await createBroadcast(newBroadcast.message, newBroadcast.type);
                       setIsAddingBroadcast(false);
                       setNewBroadcast({ message: '', type: 'info' });
                    }}
                    className="flex-1 h-14 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                 >
                    Transmit
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
