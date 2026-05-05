import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map as MapIcon, Globe, Sparkles, Loader2, Zap, ShieldCheck, Orbit, MapPinned } from "lucide-react";
import { LeadFinder } from "./components/LeadFinder";
import { WebsiteAnalyzer } from "./components/WebsiteAnalyzer";
import { AdsRecommendations } from "./components/AdsRecommendations";
import { PersonaView } from "./components/PersonaView";
import { useConfigStatus } from "./hooks/useConfigStatus";
import { useStrategy } from "./hooks/useStrategy";
import { countReadyConnectors, getMissingVariablesLabel } from "./lib/readiness";

export default function App() {
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<'strategy' | 'audit' | 'search'>('strategy');
  const { config, loading: configLoading, configError } = useConfigStatus();
  const { loading, strategyError, data, ads, generateStrategy } = useStrategy();
  const readyCount = countReadyConnectors(config);

  return (
    <div id="dashboard-view" className="min-h-screen bg-bg text-slate-300 font-sans">
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/90 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-10">
        <div>
          <div className="logo font-display text-2xl font-extrabold tracking-tighter text-slate-200">LEADMAP STUDIO</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Prospección, auditoría y estrategia</div>
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 flex bg-surface-hover/60 p-1 rounded-2xl border border-border">
          {([
            { id: 'strategy' as const, label: 'Estrategia', icon: Zap },
            { id: 'audit' as const, label: 'Auditoría', icon: Globe },
            { id: 'search' as const, label: 'Buscador', icon: MapIcon },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs tracking-tight transition-all ${
                activeTab === item.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon size={14} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <ShieldCheck size={14} />
            {readyCount}/3 conectores
          </div>
        </div>
      </header>

      <main className="pt-28 p-8 max-w-[1600px] mx-auto">
        <section className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="hero-shell">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
              <Orbit size={14} />
              Workspace operativo
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black tracking-tight text-slate-100 md:text-6xl">
              Unificá estrategia, auditoría y búsqueda comercial en un solo flujo.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-400">
              Ya te dejé la base lista para operar. Lo único realmente pendiente para una experiencia completa es cargar las variables de entorno y pasar de demo a datos vivos.
            </p>
          </div>

          <div className="pro-card">
            <div className="col-header text-brand">Estado de configuración</div>
            <div className="space-y-3">
              {configError ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400">
                  Error de conexión: {configError}
                </div>
              ) : config === null ? (
                <div className="rounded-2xl border border-border bg-surface-hover px-4 py-3 text-xs font-medium text-slate-500">
                  Cargando estado de configuración...
                </div>
              ) : (
              [
                { label: "Gemini", value: config?.gemini, icon: Sparkles },
                { label: "PageSpeed", value: config?.pagespeed, icon: Globe },
                { label: "Google Maps", value: config?.googleMaps, icon: MapPinned },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-surface-hover px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface text-slate-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-300">{label}</div>
                      <div className="text-xs text-slate-500">{value ? "Configurado" : "Pendiente"}</div>
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${value ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {value ? "OK" : "Falta"}
                  </div>
                </div>
              )))}
            </div>
            {config?.missingVariables?.length ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-400">
                {getMissingVariablesLabel(config)}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-400">
                {getMissingVariablesLabel(config)}
              </div>
            )}
          </div>
        </section>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'strategy' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-8">
                  <section className="pro-card min-h-[500px] flex flex-col items-start justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/15 text-brand text-[10px] font-bold uppercase tracking-wider rounded-lg mb-6">
                      Módulo_IA_v3.0
                    </div>
                    <h2 className="section-hero">Impulsa tu <br/>Crecimiento.</h2>

                    <p className="text-slate-400 font-medium mb-8 max-w-sm">Estructura tu propuesta de valor para permitir que la IA mapee tu mercado ideal.</p>

                    <div className="w-full bg-surface-hover rounded-2xl border border-border p-4 mb-8 focus-within:ring-2 focus-within:ring-brand/20 transition-all">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Define tu negocio, mercado y oferta actual..."
                        className="w-full h-40 bg-transparent text-lg font-medium text-slate-200 outline-none resize-none placeholder:text-slate-600"
                      />
                    </div>

                    <button
                      onClick={() => void generateStrategy(description)}
                       disabled={loading || configLoading || !description.trim() || config?.strategyMode === "blocked"}
                      className="pro-btn w-full"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                           <Loader2 size={18} className="animate-spin" /> Procesando Estrategia...
                        </span>
                      ) : config?.strategyMode === "blocked" ? "Cargá GEMINI_API_KEY para habilitar estrategia" : "Generar Inteligencia de Mercado"}
                    </button>

                    {strategyError && (
                      <div className="mt-4 w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] font-semibold text-rose-400">
                        {strategyError}
                      </div>
                    )}

                    <div className="mt-6 grid w-full gap-3">
                      <div className={`rounded-2xl border px-4 py-3 text-xs font-medium ${config?.gemini ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
                        {config?.strategyMode === "ready" ? "Gemini listo para generar estrategia." : "Falta GEMINI_API_KEY. La pantalla ya está preparada; sólo queda cargar esa variable."}
                      </div>
                    </div>

                    <div className="mt-10 flex gap-1.5 w-full">
                       <div className="h-1 flex-1 bg-brand/20 rounded-full overflow-hidden">
                          <div className="h-full bg-brand w-1/3" />
                       </div>
                       <div className="h-1 flex-1 bg-brand/10 rounded-full" />
                       <div className="h-1 flex-1 bg-brand/5 rounded-full" />
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-7 space-y-8">
                  {!data ? (
                     <div className="pro-card h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-border bg-transparent">
                        <div className="w-16 h-16 bg-surface-hover rounded-3xl flex items-center justify-center mb-6">
                          <Sparkles size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-300 mb-2">Estrategia pendiente</h3>
                        <p className="text-slate-500 max-w-xs text-sm">Definí el negocio y generá el primer brief. La UI ya está lista para devolver persona, canales y táctica exportable.</p>
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
                 <WebsiteAnalyzer config={config} />
              </div>
            )}

            {activeTab === 'search' && (
              <div className="max-w-full">
                <LeadFinder initialBusiness={data?.business} config={config} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
