import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Map as MapIcon, Users, BarChart3, Globe, Sparkles, ArrowRight, ChevronRight, Loader2, LogOut, Zap } from "lucide-react";
import { BusinessInfo, BuyerPersona, AdRecommendation } from "./types";
import { geminiService } from "./geminiService";
import { LeadFinder } from "./components/LeadFinder";
import { WebsiteAnalyzer } from "./components/WebsiteAnalyzer";
import { AdsRecommendations } from "./components/AdsRecommendations";

// Shared Persona Component
const PersonaView = ({ persona }: { persona: BuyerPersona }) => (
  <div id="persona-view" className="space-y-8">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-yellow/20 rounded-2xl flex items-center justify-center">
        <Users size={24} className="text-slate-700" />
      </div>
      <h2 className="text-3xl font-bold">{persona.industry.split(' - ')[0]}</h2>
    </div>
    
    <div className="pro-card bg-teal/10 border-teal/20">
      <div className="col-header mb-2 text-teal-700">PERFIL_ACTIVO</div>
      <p className="text-xl font-bold tracking-tight text-slate-800">{persona.company_size}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="pro-card">
        <div className="col-header mb-6 text-brand">Puntos de Dolor</div>
        <ul className="space-y-4">
          {persona.pain_points.map((p, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand/10 text-brand rounded-lg flex items-center justify-center text-[10px] font-bold">{i+1}</span>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">{p}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pro-card">
        <div className="col-header mb-6 text-amber-600">Objetivos_Crecimiento</div>
        <ul className="space-y-4">
          {persona.goals.map((g, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">→</span>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">{g}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [data, setData] = useState<{ business: BusinessInfo; persona: BuyerPersona } | null>(null);
  const [ads, setAds] = useState<AdRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'audit' | 'search'>('strategy');

  const handleProcessStrategy = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const result = await geminiService.analyzeBusiness(description);
      setData(result);
      const adRecs = await geminiService.recommendAds(result.business, result.persona);
      setAds(adRecs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="dashboard-view" className="min-h-screen bg-bg text-slate-900 font-sans">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-10">
        <div className="logo font-display text-2xl font-extrabold tracking-tighter text-slate-800">LEADMAP AI</div>
        
        {/* Centered Navigation */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'strategy', label: 'Estrategia', icon: Zap },
            { id: 'audit', label: 'Auditoría', icon: Globe },
            { id: 'search', label: 'Buscador', icon: MapIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs tracking-tight transition-all ${
                activeTab === item.id 
                  ? 'bg-white text-brand shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <item.icon size={14} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           <button className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
              <Users size={18} />
           </button>
        </div>
      </header>

      <main className="pt-28 p-8 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'strategy' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Hero/Input */}
                <div className="lg:col-span-5 space-y-8">
                  <section className="pro-card min-h-[500px] flex flex-col items-start justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-lg text-[10px] font-bold uppercase tracking-wider mb-6">
                      Módulo_IA_v3.0
                    </div>
                    <h2 className="section-hero">Impulsa tu <br/>Crecimiento.</h2>
                    
                    <p className="text-slate-500 font-medium mb-8 max-w-sm">Estructura tu propuesta de valor para permitir que la IA mapee tu mercado ideal.</p>

                    <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-8 focus-within:ring-2 focus-within:ring-brand/10 transition-all">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Define tu negocio, mercado y oferta actual..."
                        className="w-full h-40 bg-transparent text-lg font-medium outline-none resize-none placeholder:text-slate-300"
                      />
                    </div>
                    
                    <button
                      onClick={handleProcessStrategy}
                      disabled={loading || !description.trim()}
                      className="pro-btn w-full"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                           <Loader2 size={18} className="animate-spin" /> Procesando Estrategia...
                        </span>
                      ) : "Generar Inteligencia de Mercado"}
                    </button>
                    
                    {/* Visual indicators */}
                    <div className="mt-10 flex gap-1.5 w-full">
                       <div className="h-1 flex-1 bg-brand/20 rounded-full overflow-hidden">
                          <div className="h-full bg-brand w-1/3" />
                       </div>
                       <div className="h-1 flex-1 bg-teal/20 rounded-full" />
                       <div className="h-1 flex-1 bg-yellow/40 rounded-full" />
                    </div>
                  </section>
                </div>

                {/* Right Column: Persona & Results */}
                <div className="lg:col-span-7 space-y-8">
                  {!data ? (
                     <div className="pro-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-slate-50 border-dashed border-2 stroke-slate-200">
                        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                          <Sparkles size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Información Requerida</h3>
                        <p className="text-slate-500 max-w-xs text-sm">Completa el formulario de la izquierda para desplegar el análisis de audiencia y canales.</p>
                     </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      <PersonaView persona={data.persona} />
                      <AdsRecommendations recommendations={ads} />
                    </motion.div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'audit' && (
              <div className="max-w-6xl mx-auto">
                 <WebsiteAnalyzer />
              </div>
            )}
            
            {activeTab === 'search' && (
              <div className="max-w-full">
                <LeadFinder initialBusiness={data?.business} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
