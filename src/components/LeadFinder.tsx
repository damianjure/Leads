import { useState, useEffect } from "react";
import { Search, MapPin, Globe, Phone, Filter, Loader2, Navigation, Download, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppConfigStatus, BusinessInfo, Lead, PlaceDetailsResponse } from "../types";
import { exportData } from "../lib/exportUtils";
import { getErrorMessage } from "../lib/errors";
import { api } from "../lib/api";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const Colors: Record<string, string> = {
  HIGH: '#10b981',
  MEDIUM: '#f59e0b',
  LOW: '#64748b',
};

const HighIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${Colors.HIGH};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const MedIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${Colors.MEDIUM};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const LowIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${Colors.LOW};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const getMarkerIcon = (score: string) => {
  switch (score) {
    case 'HIGH': return HighIcon;
    case 'MEDIUM': return MedIcon;
    default: return LowIcon;
  }
};

const DEFAULT_MAP_CENTER: [number, number] = [40.4168, -3.7038];

const MapAutoCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const formatAddress = (addr: string) => addr.split(',').slice(0, 2).join(',');

export const LeadFinder = ({
  initialBusiness,
  config,
}: {
  initialBusiness?: BusinessInfo;
  config: AppConfigStatus | null;
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDetails, setLeadDetails] = useState<PlaceDetailsResponse | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [initialCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);

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
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesScore = query.filters.score === 'ALL' || lead.opportunity_score === query.filters.score;
    const matchesWebsite = !query.filters.hasWebsite || !!lead.website;
    const matchesPhone = !query.filters.hasPhone || !!lead.phone;
    return matchesScore && matchesWebsite && matchesPhone;
  });

  const handleSearch = async (overrides?: Partial<Pick<typeof query, "searchType" | "searchLocation">>) => {
    const searchType = overrides?.searchType ?? query.searchType;
    const searchLocation = overrides?.searchLocation ?? query.searchLocation;

    if (!searchType || !searchLocation) return;
    setLoading(true);
    setSelectedLead(null);
    setLeadDetails(null);
    setSearchMessage(null);
    try {
      const geoData = await api.getGeocode(searchLocation);

      let lat = DEFAULT_MAP_CENTER[0];
      let lng = DEFAULT_MAP_CENTER[1];

      if (geoData.results && geoData.results.length > 0) {
        const { location } = geoData.results[0].geometry;
        lat = location.lat;
        lng = location.lng;
        setMapCenter([lat, lng]);
      }

      const locationCoords = `${lat},${lng}`;
      const placesData = await api.searchPlaces(searchType, locationCoords);

      if (placesData.source === "live" && placesData.leads.length > 0) {
        setLeads(placesData.leads);
        setSelectedLead(placesData.leads[0]);
        setSearchMessage(`${placesData.leads.length} negocios encontrados para "${searchType}" en ${searchLocation}.`);
      } else if (placesData.source === "demo") {
        setLeads([]);
        setSearchMessage(placesData.note || "Cargá GOOGLE_MAPS_API_KEY para búsqueda real de negocios.");
      } else {
        setLeads([]);
        setSearchMessage(`No se encontraron negocios para "${searchType}" en ${searchLocation}.`);
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error(error);
      setLeads([]);
      setSearchMessage(getErrorMessage(error, "No se pudo generar la búsqueda. Intentá de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setLeadDetails(null);
    if (lead.place_id) {
      setFetchingDetails(true);
      try {
        const details = await api.getPlaceDetails(lead.place_id);
        setLeadDetails(details);
        if (details.phone) {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, phone: details.phone } : l));
        }
        if (details.website) {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, website: details.website } : l));
        }
        if (details.photoUrl) {
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, photoUrl: details.photoUrl } : l));
        }
      } catch {
        // details fetch failed silently, lead data still shown
      } finally {
        setFetchingDetails(false);
      }
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

      if (newType && newLoc) {
        void handleSearch({
          searchType: newType,
          searchLocation: newLoc,
        });
      }
    }
  }, [initialBusiness]);

  return (
    <div className="flex h-[calc(100vh-160px)] gap-8">
      {/* List Sidebar */}
      <div className="w-[480px] flex flex-col h-full overflow-hidden">
        <div className="pro-card mb-6 bg-blue-500/5 border-blue-500/10">
          <div className="col-header text-blue-400">Rastreo de Leads_v4.0</div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {config?.leadSearchMode === "ready" ? "Places API activo" : "Modo demo"}
          </div>

          <div className="space-y-4 mb-8">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
               <input
                type="text"
                value={query.searchType}
                onChange={(e) => setQuery(prev => ({ ...prev, searchType: e.target.value }))}
                placeholder="Negocio (ej. Odontología)"
                className="pro-input w-full pl-12"
               />
            </div>
            <div className="relative">
               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
               <input
                type="text"
                value={query.searchLocation}
                onChange={(e) => setQuery(prev => ({ ...prev, searchLocation: e.target.value }))}
                placeholder="Localización (ej. Barcelona)"
                className="pro-input w-full pl-12"
               />
            </div>
             <button
               onClick={() => void handleSearch()}
              disabled={loading || !query.searchType || !query.searchLocation}
              className="pro-btn w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> Buscando negocios...
                </span>
              ) : "Escanear Area Seleccionada"}
            </button>
          </div>

          {searchMessage && (
            <div className="mb-6 rounded-2xl border border-border bg-surface-hover px-4 py-3 text-xs font-medium text-slate-400">
              {searchMessage}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full py-2.5 rounded-xl border border-slate-200 font-bold text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all ${
                showFilters || query.filters.score !== 'ALL' || query.filters.hasWebsite || query.filters.hasPhone
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-surface text-slate-400 hover:bg-surface-hover'
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
                                : 'bg-surface border-border text-slate-400 hover:border-border-light'
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
                        query.filters.hasWebsite ? 'bg-teal text-white border-teal shadow-md shadow-teal/10' : 'bg-surface border-border text-slate-400'
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
                        query.filters.hasPhone ? 'bg-teal text-white border-teal shadow-md shadow-teal/10' : 'bg-surface border-border text-slate-400'
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
              className="w-full mt-6 py-2.5 bg-slate-700 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors"
            >
              <Download size={14} /> EXPORTAR CSV ({filteredLeads.length})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 pro-card border-dashed">
              <Loader2 className="animate-spin text-brand" size={40} />
              <div className="col-header font-bold animate-pulse">Buscando negocios con Google Places...</div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 pro-card bg-transparent border-dashed border-2 border-border text-slate-500">
              <MapPin size={48} className="mb-4 opacity-10" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-center px-8">
                {leads.length > 0 ? "Ajustá los filtros para ver resultados" : "Realizá una búsqueda para visualizar el mercado"}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => void handleSelectLead(lead)}
                className={`w-full text-left p-6 pro-card !transition-all group relative ${
                  selectedLead?.id === lead.id
                    ? 'ring-2 ring-brand/50 ring-offset-2 ring-offset-surface border-transparent'
                    : 'hover:border-brand/20 hover:bg-surface-hover'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                    lead.opportunity_score === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400' :
                    lead.opportunity_score === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {lead.opportunity_score === 'HIGH' ? 'PRIORIDAD CRÍTICA' :
                     lead.opportunity_score === 'MEDIUM' ? 'POTENCIAL MEDIO' : 'OPORTUNIDAD BAJA'}
                  </span>
                  <div className="flex items-center gap-3 text-slate-300">
                    {lead.rating ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <Star size={10} fill="currentColor" /> {lead.rating}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-mono font-medium">{lead.totalRatings} reviews</span>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-slate-200 mb-2 leading-tight">{lead.name}</h4>
                <p className="text-[11px] font-medium text-slate-500 mb-4">{formatAddress(lead.address)}</p>

                {lead.types && lead.types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.types && lead.types.filter((t: string) => t !== 'point_of_interest' && t !== 'establishment').slice(0, 3).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-surface-hover border border-border rounded-md text-[9px] font-medium text-slate-400 capitalize">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 text-slate-600">
                  <Globe size={16} className={lead.website ? 'text-blue-400' : ''} />
                  <Phone size={16} className={lead.phone ? 'text-brand' : ''} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-surface-hover rounded-[40px] border border-border overflow-hidden h-full">
        <MapContainer
          center={mapCenter}
          zoom={14}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['0','1','2','3']}
          />
          <MapAutoCenter center={mapCenter} />

          {filteredLeads.map((lead) => (
            <Marker
              key={lead.id}
              icon={getMarkerIcon(lead.opportunity_score)}
              position={[lead.lat!, lead.lng!]}
              eventHandlers={{
                click: () => void handleSelectLead(lead),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[160px]">
                  <h4 className="font-bold text-slate-800 text-sm">{lead.name}</h4>
                  <p className="text-[10px] text-slate-500 mb-1">{formatAddress(lead.address)}</p>
                  {lead.rating && (
                    <p className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> {lead.rating} ({lead.totalRatings} reviews)
                    </p>
                  )}
                  <div className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                    lead.opportunity_score === 'HIGH' ? 'text-emerald-500' : lead.opportunity_score === 'MEDIUM' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {lead.opportunity_score === 'HIGH' ? 'Máxima prioridad' : lead.opportunity_score === 'MEDIUM' ? 'Potencial medio' : 'Oportunidad baja'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute top-10 right-10 flex flex-col gap-2 z-[1000]">
          <button
            onClick={() => setMapCenter(initialCenter)}
            className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand shadow-xl border border-border transition-all"
            title="Centrar Mapa"
          >
            <Navigation size={20} />
          </button>
        </div>

        {selectedLead && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 right-4 md:top-10 md:left-10 md:w-[440px] pro-card !p-8 md:!p-12 shadow-2xl z-[1001] bg-surface"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">Perfil del Prospecto</div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-10 h-10 rounded-2xl bg-surface-hover flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2 leading-tight">{selectedLead.name}</h3>

            {selectedLead.rating && (
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-amber-500" fill="currentColor" />
                <span className="text-sm font-bold text-slate-300">{selectedLead.rating}</span>
                <span className="text-xs text-slate-500">({selectedLead.totalRatings} reseñas)</span>
              </div>
            )}

            {selectedLead.types && (
              <div className="flex flex-wrap gap-1 mb-6">
                {selectedLead.types.filter(t => t !== 'point_of_interest' && t !== 'establishment').slice(0, 4).map(t => (
                  <span key={t} className="px-2 py-0.5 bg-brand/15 text-brand rounded-md text-[10px] font-medium capitalize">
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-6 mb-10 pt-8 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-slate-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-300 uppercase">Ubicación</div>
                  <p className="text-sm font-bold text-slate-600 truncate max-w-[260px]">{selectedLead.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLead.phone || leadDetails?.phone ? 'bg-brand/15 text-brand' : 'bg-surface-hover text-slate-500'}`}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Contacto</div>
                    {fetchingDetails ? (
                      <p className="text-xs text-slate-500 animate-pulse">Cargando...</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-300 italic leading-none">
                        {leadDetails?.phone || selectedLead.phone || 'No disponible'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLead.website || leadDetails?.website ? 'bg-blue-500/15 text-blue-400' : 'bg-surface-hover text-slate-500'}`}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Sitio Web</div>
                    {fetchingDetails ? (
                      <p className="text-xs text-slate-500 animate-pulse">Cargando...</p>
                    ) : leadDetails?.website || selectedLead.website ? (
                      <a
                        href={leadDetails?.website || selectedLead.website || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-blue-400 hover:underline italic leading-none block truncate max-w-[140px]"
                      >
                        Visitar
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-slate-500 italic leading-none">No disponible</p>
                    )}
                  </div>
                </div>
              </div>

              {leadDetails?.photoUrl && (
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={leadDetails.photoUrl}
                    alt={selectedLead.name}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
               <button
                 onClick={() => exportData.leadsToCSV(filteredLeads, `pipeline_${query.searchType}_${query.searchLocation}`)}
                 className="flex-1 pro-btn !py-4"
               >
                 Exportar pipeline
               </button>
               <button
                 onClick={() => exportData.asJSON(selectedLead, `lead_${selectedLead.id}`)}
                 className="pro-btn-outline !p-4 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400"
                 title="Exportar lead como JSON"
               >
                 <Download size={20} />
               </button>
               <button
                 onClick={() => setSelectedLead(null)}
                 className="pro-btn-outline !p-4"
                 title="Cerrar detalle"
               >
                 <Zap size={20} className="text-brand" />
               </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
