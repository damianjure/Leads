import { AdRecommendation } from "../types";
import { Megaphone, Target, Zap, Layout, ChevronRight, Download } from "lucide-react";
import { exportData } from "../lib/exportUtils";

export const AdsRecommendations = ({ recommendations }: { recommendations: AdRecommendation | null }) => {
  if (!recommendations) return (
    <div className="flex flex-col items-center justify-center p-20 text-slate-600">
      <Megaphone size={48} className="mb-4 opacity-20" />
      <p className="font-mono text-sm uppercase tracking-widest">Generating Strategy Suggestions...</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="md:col-span-2 pro-card bg-white group hover:shadow-xl transition-all relative overflow-hidden !p-12">
         <div className="absolute top-0 right-0 p-8 text-slate-50 font-display text-9xl tracking-tighter italic uppercase pointer-events-none">TACTIC</div>
         <div className="col-header text-brand">Estrategia_Core</div>
         <h3 className="text-4xl font-bold text-slate-800 leading-tight">
            "{recommendations.strategy}"
         </h3>
      </div>

      <div className="pro-card bg-brand !p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-10">
           <Target size={40} className="text-white" />
        </div>
        <h4 className="text-3xl font-bold text-white mb-6">Desplegar</h4>
        <button 
          onClick={() => exportData.asJSON(recommendations, 'estrategia_ads')}
          className="w-full py-4 bg-white text-brand rounded-2xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Exportar Datos
        </button>
      </div>

      <div className="pro-card bg-mint/10 border-mint/20">
         <div className="col-header text-emerald-700">Clusteres_Target</div>
         <div className="space-y-4">
           {recommendations.targeting.map((t, i) => (
             <div key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {t}
             </div>
           ))}
         </div>
      </div>

      <div className="pro-card bg-yellow/10 border-yellow/20">
         <div className="col-header text-amber-700">Canales_Recomendados</div>
         <div className="flex flex-wrap gap-2">
           {recommendations.channels.map((c, i) => (
             <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
               {c}
             </span>
           ))}
         </div>
      </div>

      <div className="pro-card bg-brand text-white shadow-brand/20">
          <div className="col-header text-white/60">AD_TACTICIAN</div>
          <p className="text-lg font-medium opacity-90">Presupuesto sugerido centrado en optimización de leads de alta intención mediante segmentación dinámica.</p>
      </div>
    </div>
  );
};
