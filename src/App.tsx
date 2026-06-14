import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Shield, AlertTriangle, CheckCircle, Activity, Server, Lock, Mail, UserPlus, LogIn, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AuditLog {
  id: number;
  eventType: string;
  resourceId: string;
  severity: string;
  description: string;
  aiAnalysis: string;
  timestamp: string;
}

function App() {
  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard States
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [status, setStatus] = useState<string>('Connecting...');

  // চেক করা ইউজার অলরেডি লগইন করা আছে কি না
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (isLoggedIn === 'true') {
      setAuthMode('dashboard');
    }
  }, []);

  // ড্যাশবোর্ডের SignalR লাইভ কানেকশন (শুধুমাত্র ড্যাশবোর্ড মোডে থাকলে রান হবে)
  useEffect(() => {
    if (authMode !== 'dashboard') return;

    fetch('http://localhost:5167/api/auditlogs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.log("Initial fetch error:", err));

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5167/notificationHub')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => setStatus('Connected'))
      .catch(() => setStatus('Disconnected'));

    connection.on('ReceiveThreatAlert', (newLog: AuditLog) => {
      setLogs(prevLogs => [newLog, ...prevLogs]);
    });

    return () => {
      connection.stop();
    };
  }, [authMode]);

  // Auth Handlers
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }
    localStorage.setItem('adminEmail', email);
    localStorage.setItem('adminPassword', password);
    setAuthError('');
    alert('Sign up successful! Please log in.');
    setAuthMode('login');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedEmail = localStorage.getItem('adminEmail');
    const savedPassword = localStorage.getItem('adminPassword');

    // ডিফল্ট ডেমো ক্রিয়েশন (যদি সাইন আপ না করে সরাসরি লগইন করতে চায়)
    const validEmail = savedEmail || 'admin@cloudguard.com';
    const validPassword = savedPassword || 'password123';

    if (email === validEmail && password === validPassword) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      setAuthError('');
      setAuthMode('dashboard');
    } else {
      setAuthError('Invalid email or password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setAuthMode('login');
    setEmail('');
    setPassword('');
  };

  // ==================== ১. সাইন আপ স্ক্রিন ====================
  if (authMode === 'signup') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-500/10 rounded-full text-emerald-400 mb-2">
              <UserPlus size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create Admin Account</h1>
            <p className="text-slate-400 text-xs">Register to access the AI Orchestrator dashboard</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="name@company.com" required />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" required />
              </div>
            </div>

            {authError && <p className="text-xs text-rose-400 font-medium">{authError}</p>}

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/10 cursor-pointer">
              Register Admin
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-emerald-400 font-semibold hover:underline cursor-pointer">Log In</button>
          </p>
        </div>
      </div>
    );
  }

  // ==================== ২. লগইন স্ক্রিন ====================
  if (authMode === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-cyan-500/10 rounded-full text-cyan-400 mb-2">
              <Shield size={32} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CloudGuard Portal</h1>
            <p className="text-slate-400 text-xs">Secure Admin Authentication Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="admin@cloudguard.com" required />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="••••••••" required />
              </div>
            </div>

            {authError && <p className="text-xs text-rose-400 font-medium">{authError}</p>}

            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all hover:opacity-90 text-sm shadow-lg shadow-cyan-500/10 cursor-pointer">
              Authenticate Securely
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            Don't have an admin key?{' '}
            <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} className="text-cyan-400 font-semibold hover:underline cursor-pointer">Sign Up</button>
          </p>
          
          <div className="text-center text-[10px] text-slate-600 bg-slate-950/40 py-2 rounded-lg border border-slate-850">
            Demo default: <span className="text-slate-400">admin@cloudguard.com</span> / <span className="text-slate-400">password123</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ৩. মেইন ড্যাশবোর্ড স্ক্রিন (লগইন করার পর) ====================
  const chartData = logs.map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    severity: log.severity === 'High' ? 3 : log.severity === 'Medium' ? 2 : 1
  })).reverse();

  const totalThreats = logs.length;
  const highSeverity = logs.filter(l => l.severity === 'High').length;
  const activeMitigations = logs.filter(l => l.aiAnalysis?.includes('Mitigated') || l.aiAnalysis?.includes('Blocked')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Shield className="text-emerald-400 w-6 h-6 animate-pulse" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            CLOUDGUARD AI
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
            <span className="text-xs font-medium text-slate-300">Orchestrator: {status}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4 shadow-lg">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Activity size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Events Logged</p>
              <h3 className="text-2xl font-bold mt-0.5">{totalThreats}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4 shadow-lg">
            <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400"><AlertTriangle size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical Threats</p>
              <h3 className="text-2xl font-bold mt-0.5 text-rose-400">{highSeverity}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4 shadow-lg">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">AI Auto-Mitigated</p>
              <h3 className="text-2xl font-bold mt-0.5 text-emerald-400">{activeMitigations}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center space-x-4 shadow-lg">
            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400"><Server size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Monitored Clusters</p>
              <h3 className="text-2xl font-bold mt-0.5 text-cyan-400">AWS-Cluster-01</h3>
            </div>
          </div>
        </div>

        {/* Core Display Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[450px]">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-4 flex items-center">
              <span className="w-1.5 h-3 bg-emerald-400 rounded-sm mr-2"></span>
              REAL-TIME AI AUDIT STREAM
            </h2>
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></span>
                  <p>Listening for real-time cloud events...</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/40 sticky top-0">
                      <th className="pb-3 pt-1 pl-2">Severity</th>
                      <th className="pb-3 pt-1">Event Type</th>
                      <th className="pb-3 pt-1">Resource ID</th>
                      <th className="pb-3 pt-1">AI Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 pl-2">
                          <span className={`px-2 py-0.5 rounded font-semibold tracking-wide uppercase text-[10px] ${
                            log.severity === 'High' ? 'bg-rose-500/10 text-rose-400' :
                            log.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-200">{log.eventType}</td>
                        <td className="py-3 font-mono text-slate-400">{log.resourceId}</td>
                        <td className="py-3 text-slate-300 italic">{log.aiAnalysis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg h-[450px] flex flex-col">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-4 flex items-center">
              <span className="w-1.5 h-3 bg-cyan-400 rounded-sm mr-2"></span>
              INCIDENT SEVERITY TREND
            </h2>
            <div className="w-full flex-1">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data chart available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 3]} ticks={[1, 2, 3]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                    <Line type="monotone" dataKey="severity" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;