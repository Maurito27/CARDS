const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────

export interface Prospect {
  id: string;
  external_id: string | null;
  negocio: string;
  rubro: string | null;
  zona: string | null;
  direccion: string | null;
  google_maps: string | null;
  web: string | null;
  instagram: string | null;
  whatsapp_phone: string | null;
  source: string | null;
  status: string;
  priority: string;
  current_solution: string | null;
  observed_problem: string | null;
  hypothesis: string | null;
  hipotesis_comercial: string | null;
  que_falta_saber: string | null;
  decision_maker: string | null;
  decision_maker_contact: string | null;
  approx_tables: number | null;
  visit_objective: string | null;
  result: string | null;
  commercial_evidence: string | null;
  most_valued_feature: string | null;
  main_objection: string | null;
  price_presented: string | null;
  next_action: string | null;
  next_action_date: string | null;
  responsible: string | null;
  payment_status: string;
  notes: string | null;
  rating_publico: number | null;
  cantidad_resenas_publicas: number | null;
  rango_precio_publico: string | null;
  research_completeness: string | null;
  tipo_fuente: string | null;
  source_ref_auditoria: string | null;
  verificado_el: string | null;
  contactado: boolean;
  fecha_ultima_interaccion: string | null;
  resultado_ultima_interaccion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectVisit {
  id: string;
  prospect_id: string;
  visit_date: string;
  problem_detected: string | null;
  current_solution: string | null;
  last_real_case: string | null;
  frequency: string | null;
  decision_maker: string | null;
  interest_level: string | null;
  objection: string | null;
  valued_feature: string | null;
  next_step: string | null;
  next_step_date: string | null;
  evidence_level: string | null;
  result: string | null;
  notes: string | null;
}

export interface ProspectDetail extends Prospect {
  visits: ProspectVisit[];
}

export interface DashboardMetrics {
  byStatus: Record<string, number>;
  byZone: Record<string, number>;
  byEvidence: Record<string, number>;
  byResearch: Record<string, number>;
  topObjections: Array<{ objection: string; count: number }>;
  topValuedFeatures: Array<{ feature: string; count: number }>;
  totalProspects: number;
  totalSales: number;
  totalEnriquecidos: number;
  totalContactados: number;
  totalZonas: number;
  totalPrioridadAlta: number;
}

export interface ImportResult {
  inserted: number;
  errors: string[];
  total: number;
}

// ─── Constants ─────────────────────────────────────────────────────

export const PIPELINE_STATES = [
  { value: "sin_procesar", label: "Sin procesar" },
  { value: "investigado", label: "Investigado" },
  { value: "calificado", label: "Calificado" },
  { value: "visita_planificada", label: "Visita planificada" },
  { value: "visitado", label: "Visitado" },
  { value: "oportunidad", label: "Oportunidad" },
  { value: "demo", label: "Demo" },
  { value: "piloto", label: "Piloto" },
  { value: "propuesta", label: "Propuesta" },
  { value: "negociacion", label: "Negociación" },
  { value: "confirmado", label: "Confirmado" },
  { value: "descartado", label: "Descartado" },
  { value: "pausado", label: "Pausado" },
];

export const PAYMENT_STATES = [
  { value: "sin_pago", label: "Sin pago" },
  { value: "sena", label: "Seña" },
  { value: "pago_parcial", label: "Pago parcial" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
  { value: "no_aplica", label: "No aplica" },
];

export const EVIDENCE_LEVELS = [
  { value: "debil", label: "Débil" },
  { value: "media", label: "Media" },
  { value: "fuerte", label: "Fuerte" },
];

export const VISIT_RESULTS = [
  { value: "venta", label: "Venta" },
  { value: "propuesta", label: "Propuesta" },
  { value: "piloto", label: "Piloto" },
  { value: "demo", label: "Demo" },
  { value: "decisor", label: "Decisor" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "problema_detectado", label: "Problema detectado" },
  { value: "sin_problema", label: "Sin problema" },
  { value: "descartado", label: "Descartado" },
];

export const PRIORITIES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

export const HYPOTHESES = [
  { value: "A", label: "Cambios frecuentes de precios y carta generan fricción" },
  { value: "B", label: "Google Reviews es uno de los principales drivers de compra" },
  { value: "C", label: "Centralizar varios accesos mejora la experiencia del cliente" },
  { value: "D", label: "No tener que reimprimir QR genera valor" },
  { value: "E", label: "Algunos comercios pagarían por comodidad aunque existan alternativas gratuitas" },
];

export const VISIT_QUESTIONS = [
  "¿Cómo manejan hoy la carta, los QR y los distintos links del negocio?",
  "¿Cuándo fue la última vez que tuvieron que cambiar algo y qué tuvieron que hacer?",
  "¿Qué parte de ese proceso les da más trabajo o les genera más molestias?",
  "¿Qué usan actualmente para resolverlo?",
  "¿Esto lo manejás vos o lo decide otra persona?",
];

export const FOLLOW_UP_QUESTIONS = [
  "¿Eso les pasa seguido?",
  "¿Quién lo cambia normalmente?",
  "¿Cuánto tardan?",
  "¿Tienen que imprimir algo de nuevo?",
  "¿Alguna vez quedó un QR o link viejo?",
  "¿Cómo consiguen reseñas de Google hoy?",
  "¿Los clientes preguntan seguido por WiFi, carta o medios de pago?",
  "¿Cuántas mesas tienen?",
  "¿Tienen QR actualmente?",
  "¿A dónde apunta?",
  "¿Qué cambiarías del sistema que usan hoy?",
];

export const OBJECTIONS = [
  { trigger: "Ya tengo QR", response: "Perfecto. ¿Y cuando cambia la carta o el link, cómo lo actualizan?" },
  { trigger: "Uso Linktree gratis", response: "Sí, totalmente. ¿Con eso tienen todo resuelto o hay alguna parte que todavía les dé trabajo?" },
  { trigger: "No me interesa", response: "Perfecto. Antes de irme, así entiendo mejor: ¿porque ya lo tienen bien resuelto o porque directamente no es algo importante para ustedes?" },
  { trigger: "Mandame información", response: "Dale. ¿Qué parte te interesó más? Así te mando solamente lo relevante." },
  { trigger: "¿Cuánto sale?", response: "Usar únicamente pricing autorizado. No improvisar. No ofrecer descuentos no autorizados." },
  { trigger: "Es caro", response: "¿Caro respecto a qué? ¿Cuánto les cuesta hoy cambiar QR, reimprimir, o perder reseñas?" },
  { trigger: "No quiero mensualidad", response: "Entiendo. ¿Te gustaría que te cuente las opciones de pago único que estamos evaluando?" },
  { trigger: "Ya tengo página", response: "Perfecto. ¿Y cómo hacen para que los clientes lleguen a la página desde la mesa?" },
  { trigger: "Mis clientes no usan NFC", response: "El QR funciona igual. El NFC es un bonus para quienes lo tengan. El QR es lo principal." },
  { trigger: "QR gratis", response: "Claro. ¿Y cuando tenés que cambiarlo, qué hacés? ¿Reimprimís? ¿Cuántas veces por año?" },
  { trigger: "No quiero otra plataforma", response: "Entiendo. ¿Qué plataformas usás hoy y qué parte te genera más trabajo?" },
  { trigger: "¿Qué pasa si ustedes desaparecen?", response: "Pregunta válida. [Usar respuesta de política de continuidad autorizada]" },
  { trigger: "No tengo tiempo", response: "Te entiendo. Te tomo dos minutos y te dejo seguir. ¿Cómo manejás hoy los QR y links?" },
];

export const CTA_OPTIONS = [
  "Mostrar demo",
  "Pedir contacto del dueño",
  "Ofrecer piloto",
  "Preparar propuesta",
  "Fijar seguimiento",
];

export const OPENING_SCRIPT =
  "Hola, ¿cómo va? Soy Mauro. Estoy trabajando con una solución para locales que permite manejar carta, reseñas, WhatsApp y otros accesos desde un mismo QR y NFC, sin tener que cambiar el soporte cada vez que cambia la información. Te hago dos preguntas rápidas y te dejo seguir.";

export const DEMO_SCRIPT =
  "Justamente para eso estamos armando esto. El QR y el NFC siempre quedan iguales, pero desde un panel podés cambiar lo que muestran. Podés tener accesos a carta, reseñas, WhatsApp, pagos, WiFi u otros destinos sin reemplazar el soporte.";

export const POST_DEMO_QUESTIONS = [
  "Viendo cómo trabajan ustedes hoy, ¿esto les resolvería algo concreto?",
  "¿Qué parte te serviría más?",
];

export function statusLabel(value: string): string {
  return PIPELINE_STATES.find((s) => s.value === value)?.label || value;
}

export function paymentLabel(value: string): string {
  return PAYMENT_STATES.find((s) => s.value === value)?.label || value;
}

export function evidenceLabel(value: string): string {
  return EVIDENCE_LEVELS.find((s) => s.value === value)?.label || value;
}

export function priorityLabel(value: string): string {
  return PRIORITIES.find((s) => s.value === value)?.label || value;
}

export function resultLabel(value: string): string {
  return VISIT_RESULTS.find((s) => s.value === value)?.label || value;
}

// ─── API ───────────────────────────────────────────────────────────

export const salesApi = {
  list: (params?: { status?: string; zona?: string; priority?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.zona) qs.set("zona", params.zona);
    if (params?.priority) qs.set("priority", params.priority);
    const q = qs.toString();
    return request<Prospect[]>(`/prospects${q ? `?${q}` : ""}`);
  },

  get: (id: string) => request<ProspectDetail>(`/prospects/${id}`),

  create: (data: Partial<Prospect>) =>
    request<Prospect>("/prospects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  import: (data: unknown) =>
    request<ImportResult>("/prospects/import", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Prospect>) =>
    request<Prospect>(`/prospects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/prospects/${id}`, { method: "DELETE" }),

  addVisit: (id: string, data: Partial<ProspectVisit>) =>
    request<ProspectVisit>(`/prospects/${id}/visits`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  metrics: () => request<DashboardMetrics>("/prospects/metrics/dashboard"),
};
