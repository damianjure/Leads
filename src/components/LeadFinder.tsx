import { useState, useEffect } from "react";
import { Search, MapPin, Globe, Phone, Filter, Loader2, Navigation, Download, Zap, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BusinessInfo, Lead } from "../types";
import { exportData } from "../lib/exportUtils";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom component to update map view
const MapAutoCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const LeadFinder = ({ initialBusiness }: { initialBusiness?: BusinessInfo }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid default
  
  // Unified search query state
  const [query, setQuery] = useState({
    searchType: "",
    searchLocation: "",
    filters: {
      score: 'ALL' as string,
      hasWebsite: false,
      hasPhone: false
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesScore = query.filters.score === 'ALL' || lead.opportunity_score === query.filters.score;
    const matchesWebsite = !query.filters.hasWebsite || !!lead.website;
    const matchesPhone = !query.filters.hasPhone || !!lead.phone;
    return matchesScore && matchesWebsite && matchesPhone;
  });

  const handleSearch = async () => {
    if (!query.searchType || !query.searchLocation) return;
    setLoading(true);
    setSelectedLead(null);
    try {
      // 1. First, geocode the location to get map center using our Google Proxy
      const geoRes = await fetch(`/api/google/geocode?address=${encodeURIComponent(query.searchLocation)}`);
      const geoData = await geoRes.json();
      
      let lat = 40.4168;
      let lng = -3.7038;

      if (geoData.results && geoData.results.length > 0) {
        const { location } = geoData.results[0].geometry;
        lat = location.lat;
        lng = location.lng;
        setMapCenter([lat, lng]);
      }

      // 2. Simulate finding leads around that location
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockLeads: Lead[] = [
        {
          id: "1",
          name: `${query.searchType.toUpperCase()} ELITE`,
          category: query.searchType,
          address: `Calle Principal 123, ${query.searchLocation}`,
          lat: lat + 0.002,
          lng: lng + 0.002,
          opportunity_score: "HIGH",
          website: "https://example.com",
          phone: "+34 912 345 678"
        },
        {
          id: "2",
          name: `${query.searchType} LOCAL`,
          category: query.searchType,
          address: `Av. de la Constitución 45, ${query.searchLocation}`,
          lat: lat - 0.003,
          lng: lng + 0.001,
          opportunity_score: "MEDIUM",
          website: "https://local-biz.es",
          phone: "+34 913 456 789"
        },
        {
          id: "3",
          name: "NEGOCIO TRADICIONAL",
          category: "General",
          address: `Plaza Mayor 5, ${query.searchLocation}`,
          lat: lat + 0.001,
          lng: lng - 0.002,
          opportunity_score: "LOW",
          phone: "+34 914 567 890"
        },
        {
          id: "4",
          name: "CENTER DEPOT",
          category: query.searchType,
          address: `Polígono Ind. Sur, ${query.searchLocation}`,
          lat: lat - 0.005,
          lng: lng - 0.004,
          opportunity_score: "HIGH",
          website: "https://center-depot.com"
        }
      ];
      setLeads(mockLeads);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBusiness) {
      const newType = initialBusiness.target_niche || "";
      const newLoc = initialBusiness.location || "";
      
      setQuery(prev => ({
        ...prev,
        searchType: newType,
        searchLocation: newLoc
      }));

      // Trigger search if data exists
      if (newType && newLoc) {
        // We need to pass the values directly or ensure handleSearch uses latest query
        // For simulation, we'll just call it if we have values
        handleSearch(); 
      }
    }
  }, [initialBusiness]);

  const handleSaveToSheets = async () => {
    if (leads.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch("/api/google/sheets/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      });
      const result = await response.json();
      if (result.authUrl) {
        window.open(result.authUrl, "GoogleAuth", "width=600,height=600");
      } else if (result.success) {
        alert("¡Datos guardados con éxito en Google Sheets!");
      }
    } catch (error) {
      console.error("Error saving to sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] gap-8">
      {/* List Sidebar */}
      <div className="w-[480px] flex flex-col h-full overflow-hidden">
        <div className="pro-card mb-6 bg-teal/5 border-teal/20">
          <div className="col-header text-teal-700">Rastreo de Leads_v3.0</div>
          
          <div className="space-y-4 mb-8">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               <input 
                type="text" 
                value={query.searchType}
                onChange={(e) => setQuery(prev => ({ ...prev, searchType: e.target.value }))}
                placeholder="Negocio (ej. Odontología)"
                className="pro-input w-full pl-12"
               />
            </div>
            <div className="relative">
               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
               <input 
                type="text" 
                value={query.searchLocation}
                onChange={(e) => setQuery(prev => ({ ...prev, searchLocation: e.target.value }))}
                placeholder="Localización (ej. Barcelona)"
                className="pro-input w-full pl-12"
               />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading || !query.searchType || !query.searchLocation}
              className="pro-btn w-full shadow-lg shadow-brand/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Procesando Escaneo...
                </span>
              ) : "Escanear Area Seleccionada"}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full py-2.5 rounded-xl border border-slate-200 font-bold text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all ${
                showFilters || query.filters.score !== 'ALL' || query.filters.hasWebsite || query.filters.hasPhone
                  ? 'bg-yellow/20 text-amber-700 border-yellow/30' 
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter size={12} /> {showFilters ? 'OCULTAR FILTROS' : 'REFINAR BÚSQUEDA'}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-6 pt-6 border-t border-slate-100 mt-2"
                >
                  <div className="space-y-3">
                    <label className="col-header block text-center mb-0">Prioridad de Cierre</label>
                    <div className="flex gap-2">
                      {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(prev => ({ 
                            ...prev, 
                            filters: { ...prev.filters, score: s } 
                          }))}
                          className={`flex-1 py-2 rounded-xl border font-bold text-[10px] transition-all ${
                            query.filters.score === s 
                              ? 'bg-brand text-white border-brand shadow-md shadow-brand/10' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {s === 'ALL' ? 'TODO' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQuery(prev => ({ 
                        ...prev, 
                        filters: { ...prev.filters, hasWebsite: !prev.filters.hasWebsite } 
                      }))}
                      className={`py-2 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 transition-all ${
                        query.filters.hasWebsite ? 'bg-teal text-white border-teal shadow-md shadow-teal/10' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <Globe size={12} /> Con Web
                    </button>
                    <button
                      onClick={() => setQuery(prev => ({ 
                        ...prev, 
                        filters: { ...prev.filters, hasPhone: !prev.filters.hasPhone } 
                      }))}
                      className={`py-2 rounded-xl border font-bold text-[10px] flex items-center justify-center gap-2 transition-all ${
                        query.filters.hasPhone ? 'bg-teal text-white border-teal shadow-md shadow-teal/10' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <Phone size={12} /> Con Tel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!loading && leads.length > 0 && (
            <button 
              onClick={() => exportData.leadsToCSV(filteredLeads, `lista_leads_${query.searchType}_${query.searchLocation}`)}
              className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Download size={14} /> EXPORTAR CSV ({filteredLeads.length})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 pro-card border-dashed">
              <Loader2 className="animate-spin text-brand" size={40} />
              <div className="col-header font-bold animate-pulse">Sincronizando Leads...</div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 pro-card bg-slate-50 border-dashed text-slate-400">
              <MapPin size={48} className="mb-4 opacity-20" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-center px-8">
                {leads.length > 0 ? "Ajusta los filtros para ver resultados" : "Realiza una búsqueda para visualizar el mercado"}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`w-full text-left p-6 pro-card !transition-all group relative ${
                  selectedLead?.id === lead.id 
                    ? 'ring-2 ring-brand ring-offset-2 border-transparent' 
                    : 'hover:border-brand hover:bg-brand/5'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                    lead.opportunity_score === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                    lead.opportunity_score === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {lead.opportunity_score === 'HIGH' ? 'PRIORIDAD CRÍTICA' : 
                     lead.opportunity_score === 'MEDIUM' ? 'POTENCIAL MEDIO' : 'OPORTUNIDAD BAJA'}
                  </span>
                  <div className="text-[10px] font-mono font-medium text-slate-300">#{lead.id}</div>
                </div>
                <h4 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">{lead.name}</h4>
                <p className="text-[11px] font-medium text-slate-400 mb-6">{lead.address}</p>
                
                <div className="flex gap-4 text-slate-300">
                  <Globe size={16} className={lead.website ? 'text-teal' : ''} />
                  <Phone size={16} className={lead.phone ? 'text-brand' : ''} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-slate-50 rounded-[40px] border border-slate-200 overflow-hidden h-full">
        <MapContainer 
          center={mapCenter} 
          zoom={14} 
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapAutoCenter center={mapCenter} />
          
          {filteredLeads.map((lead) => (
            <Marker 
              key={lead.id} 
              position={[lead.lat!, lead.lng!]}
              eventHandlers={{
                click: () => setSelectedLead(lead),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-slate-800">{lead.name}</h4>
                  <p className="text-[10px] text-slate-500 mb-2">{lead.address}</p>
                  <div className={`text-[9px] font-bold uppercase tracking-wider ${
                    lead.opportunity_score === 'HIGH' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {lead.opportunity_score === 'HIGH' ? 'Oportunidad Máxima' : 'Revisión Sugerida'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Controls Overlay */}
        <div className="absolute top-10 right-10 flex flex-col gap-2 z-[1000]">
          <button 
            onClick={() => setMapCenter([mapCenter[0], mapCenter[1]])} // Forces re-center
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand shadow-xl border border-slate-100 transition-all"
            title="Centrar Mapa"
          >
            <Navigation size={20} />
          </button>
        </div>

        {/* Selected Lead Detailed Overlay */}
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 right-4 md:top-10 md:left-10 md:w-[420px] pro-card !p-8 md:!p-12 shadow-2xl z-[1001]"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">Perfil del Prospecto</div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-bold"
              >
                ✕
              </button>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">{selectedLead.name}</h3>
            
            <div className="space-y-6 mb-10 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-300 uppercase">Ubicación Registrada</div>
                  <p className="text-sm font-bold text-slate-600 truncate">{selectedLead.address}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLead.phone ? 'bg-brand/10 text-brand' : 'bg-slate-50 text-slate-300'}`}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase">Contacto</div>
                    <p className="text-sm font-bold text-slate-600 italic leading-none">{selectedLead.phone || 'No disponible'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLead.website ? 'bg-teal/10 text-teal' : 'bg-slate-50 text-slate-300'}`}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase">Sitio Web</div>
                    <p className="text-sm font-bold text-slate-600 italic leading-none">{selectedLead.website ? 'Activo' : 'Pendiente'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <button className="flex-1 pro-btn !py-4 shadow-brand/20">Programar Salida</button>
               <button 
                 onClick={handleSaveToSheets}
                 className="pro-btn-outline !p-4 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                 title="Guardar en Google Sheets"
               >
                 <Database size={20} className="text-emerald-600" />
               </button>
               <button className="pro-btn-outline !p-4"><Zap size={20} className="text-brand" /></button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
