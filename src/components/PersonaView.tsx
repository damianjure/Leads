import { Users } from "lucide-react";
import { BuyerPersona } from "../types";

export const PersonaView = ({ persona }: { persona: BuyerPersona }) => (
  <div id="persona-view" className="space-y-8">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
        <Users size={24} className="text-amber-400" />
      </div>
      <h2 className="text-3xl font-bold text-slate-200">{persona.industry.split(' - ')[0]}</h2>
    </div>

    <div className="pro-card bg-blue-500/5 border-blue-500/10">
      <div className="col-header mb-2 text-blue-400">PERFIL_ACTIVO</div>
      <p className="text-xl font-bold tracking-tight text-slate-200">{persona.company_size}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section className="pro-card">
        <div className="col-header mb-6 text-brand">Puntos de Dolor</div>
        <ul className="space-y-4">
          {persona.pain_points.map((p, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand/15 text-brand rounded-lg flex items-center justify-center text-[10px] font-bold">{i+1}</span>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">{p}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pro-card">
        <div className="col-header mb-6 text-amber-400">Objetivos_Crecimiento</div>
        <ul className="space-y-4">
          {persona.goals.map((g, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">→</span>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">{g}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>

    {persona.channels.length > 0 && (
      <section className="pro-card">
        <div className="col-header mb-4 text-blue-400">Canales Recomendados</div>
        <div className="flex flex-wrap gap-2">
          {persona.channels.map((c, i) => (
            <span key={i} className="px-4 py-2 bg-surface-hover border border-border rounded-xl text-xs font-bold text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </section>
    )}
  </div>
);
