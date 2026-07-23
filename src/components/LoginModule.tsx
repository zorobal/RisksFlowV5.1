import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Users, 
  BarChart3, 
  Activity, 
  CheckSquare, 
  Award,
  FileText
} from 'lucide-react';
import { User } from '../types';

interface LoginModuleProps {
  users: User[];
  onLogin: (user: User) => void;
  onEnterDemo: () => void;
}

// Logo Symbol reflecting the uploaded image (rotated square/diamond in deep blue with orange wave and right-corner dot)
const LogoSymbol = ({ className = "w-10 h-10", darkBg = false }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Diamond outline (square rotated 45deg around (50, 50)) */}
    <rect 
      x="24" 
      y="24" 
      width="52" 
      height="52" 
      rx="5" 
      transform="rotate(45 50 50)" 
      stroke={darkBg ? "#FFFFFF" : "#122D4F"} 
      strokeWidth="9" 
      fill="transparent" 
    />
    {/* Flowing orange/amber wave inside */}
    <path 
      d="M 23 58 C 35 68, 45 42, 57 58 C 65 66, 72 52, 77 50" 
      stroke="#D46F33" 
      strokeWidth="7" 
      strokeLinecap="round" 
      fill="none" 
    />
    {/* Orange dot on the right corner of the diamond */}
    <circle cx="87" cy="50" r="6.5" fill="#D46F33" />
  </svg>
);

export default function LoginModule({ users, onLogin, onEnterDemo }: LoginModuleProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      // Find matching user by email (case-insensitive)
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      
      if (foundUser) {
        const correctPassword = foundUser.password || 'vito';
        if (password === correctPassword) {
          onLogin(foundUser);
        } else {
          setError('Mot de passe incorrect.');
          setLoading(false);
        }
      } else if (email.toLowerCase().trim() === 'admin@plateforme.com') {
        const adminUser = users.find(u => u.role === 'SuperAdmin');
        const correctPassword = adminUser?.password || 'vito';
        if (password === correctPassword) {
          if (adminUser) {
            onLogin(adminUser);
          } else {
            onLogin({
              id: 'u5',
              name: 'SuperAdmin Kouam',
              email: 'admin@plateforme.com',
              role: 'SuperAdmin',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80',
              password: 'vito'
            });
          }
        } else {
          setError('Mot de passe incorrect.');
          setLoading(false);
        }
      } else {
        setError('Identifiants non reconnus. Veuillez utiliser un des profils de simulation ou saisir vos informations.');
        setLoading(false);
      }
    }, 600);
  };

  const handleQuickLogin = (user: User) => {
    setLoading(true);
    setTimeout(() => {
      onLogin(user);
    }, 450);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-200 p-4 md:p-8 font-sans select-none">
      
      {/* Centered Structured Layout Card */}
      <div className="max-w-5xl w-full flex flex-col md:flex-row rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden min-h-[620px]">
        
        {/* Left Panel: High Fidelity GRC Features Presentation */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#0F233C] via-[#163357] to-[#122D4F] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Decorative Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
          
          {/* Logo & Product Name */}
          <div className="z-10 flex items-center space-x-3">
            <LogoSymbol className="w-10 h-10" darkBg={true} />
            <div>
              <div className="text-xl font-black tracking-tight flex items-center">
                <span className="text-white">Risk</span>
                <span className="text-[#D46F33]">Flow</span>
              </div>
            </div>
          </div>

          {/* Synthetic Description */}
          <div className="my-8 z-10 max-w-md">
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D46F33] text-[9px] font-bold uppercase tracking-wider mb-5">
              <Sparkles className="w-3 h-3" />
              <span>Conformité Norme IFACI 2013 & GRC</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Pilotez intelligemment vos risques d'entreprise.
            </h2>
            <p className="mt-3 text-slate-300 text-xs leading-relaxed font-light">
              RiskFlow est une suite logicielle intégrée d'identification, d'évaluation matricielle et de suivi de conformité réglementaire. Elle garantit une isolation de niveau bancaire et des workflows collaboratifs étanches par client.
            </p>

            {/* Structured Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="flex space-x-2.5">
                <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10 text-orange-400 h-8 w-8 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Tableaux de Bord</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Synthèse visuelle de criticité globale et rapports d'audits consolidés.</p>
                </div>
              </div>

              <div className="flex space-x-2.5">
                <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10 text-orange-400 h-8 w-8 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Matrice de Criticité</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Cartographie dynamique P*I avec filtres instantanés par entité.</p>
                </div>
              </div>

              <div className="flex space-x-2.5">
                <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10 text-orange-400 h-8 w-8 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Scoring Mathématique</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Calcul automatique des scores bruts et résiduels selon l'IFACI.</p>
                </div>
              </div>

              <div className="flex space-x-2.5">
                <div className="flex-shrink-0 p-1.5 rounded bg-white/5 border border-white/10 text-orange-400 h-8 w-8 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Plans d'Atténuation</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Suivi rigoureux d'échéances et d'attribution de responsabilité.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Version */}
          <div className="z-10 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>RiskFlow Suite v2.0 Enterprise</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Hautement Sécurisé</span>
            </span>
          </div>
        </div>

        {/* Right Panel: Authentication Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-between">
          
          <div className="my-auto space-y-6">
            
            {/* Logo and Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5 md:hidden mb-2">
                  <LogoSymbol className="w-9 h-9" />
                  <div className="text-lg font-black tracking-tight">
                    <span className="text-[#122D4F]">Risk</span>
                    <span className="text-[#D46F33]">Flow</span>
                  </div>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Connexion au Portail</h2>
                <p className="text-xs text-slate-500 mt-0.5">Saisissez vos identifiants professionnels ou simulez un compte.</p>
              </div>

              <button
                onClick={onEnterDemo}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-extrabold transition-all duration-150"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D46F33]" />
                <span>Espace Démo</span>
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Adresse Email Professionnelle
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: alainpatricknkoumou@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#122D4F] focus:ring-2 focus:ring-[#122D4F]/10 rounded-lg px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none placeholder-slate-400 transition-all duration-150"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Mot de Passe
                  </label>
                  <a href="#reset" className="text-[10px] font-bold text-[#D46F33] hover:underline">Mot de passe oublié ?</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#122D4F] focus:ring-2 focus:ring-[#122D4F]/10 rounded-lg px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none placeholder-slate-400 transition-all duration-150"
                    disabled={loading}
                  />
                </div>
                <p className="text-[9px] text-slate-400 italic">Tout mot de passe ou "vito" est accepté pour la démonstration.</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#122D4F] hover:bg-[#1C416C] text-white rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-[#122D4F]/10 active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>S'authentifier sur RiskFlow</span>
                    <ArrowRight className="w-4 h-4 text-orange-400" />
                  </>
                )}
              </button>
            </form>



          </div>

          <div className="text-[9px] text-slate-400 text-center font-mono mt-4">
            Secured and Operated by SOGESTI Systems • Cameroon
          </div>
        </div>

      </div>
    </div>
  );
}
