import {
  ShipmentData,
  TransportMode,
  ServiceType,
  Incoterm,
  Location,
  Container,
} from '../types/shipment.types';


export function parseEmail(
  emailText: string,
  filename: string
): ShipmentData {
  // Normalizar texto para búsquedas más fáciles
  const normalized = normalizeText(emailText);

  // Extraer cada campo usando funciones específicas
  const subject = extractSubject(emailText);
  const mode = extractMode(normalized);
  const service = extractService(normalized);
  const incoterm = extractIncoterm(normalized);
  const route = extractRoute(normalized);
  const containers = extractContainers(normalized);
  const weight = extractWeight(normalized);
  const volume = extractVolume(normalized);
  const date = extractDate(normalized);
  const parties = extractParties(normalized);
  const commodity = extractCommodity(normalized);

  // Construir el objeto de salida (para luego validar y convertir en JSON)
  return {
    source: {
      channel: 'email',
      subject: subject,
      received_text_file: filename,
    },
    shipment: {
      mode: mode,
      service: service,
      incoterm: incoterm,
      origin: route.origin,
      destination: route.destination,
      ready_date: date,
      cargo: {
        commodity: commodity,
        pieces: null,
        gross_weight_kg: weight,
        volume_cbm: volume,
        containers: containers,
      },
      parties: parties,
    },
    validation: {
      errors: [],
      warnings: [],
    },
  };
}

/**
 * Extrae el asunto del correo
 */
function extractSubject(text: string): string {
  // Buscar línea que empiece con "Subject:"
  const match = text.match(/^Subject:\s*(.+)$/im);
  return match ? match[1].trim() : 'No subject';
}

/**
 * Determina el modo de transporte basado en palabras clave
 */
function extractMode(text: string): TransportMode {
  const lower = text.toLowerCase();

  // Palabras clave para transporte marítimo
  if (
    lower.includes('fcl') ||
    lower.includes('lcl') ||
    lower.includes('ocean') ||
    lower.includes('sea') ||
    lower.includes('40hc') ||
    lower.includes('20ft') ||
    lower.includes('container')
  ) {
    return TransportMode.OCEAN;
  }

  // Palabras clave para transporte aéreo
  if (
    lower.includes('air') ||
    lower.includes('flight') ||
    lower.includes('airfreight')
  ) {
    return TransportMode.AIR;
  }

  // Palabras clave para transporte terrestre
  if (
    lower.includes('truck') ||
    lower.includes('ground') ||
    lower.includes('road')
  ) {
    return TransportMode.GROUND;
  }

  return TransportMode.UNKNOWN;
}

/**
 * Extrae el tipo de servicio (FCL, LCL, AIR)
 */
function extractService(text: string): ServiceType {
  const lower = text.toLowerCase();

  // Usar word boundary para evitar coincidencias parciales
  if (lower.match(/\bfcl\b/)) return ServiceType.FCL;
  if (lower.match(/\blcl\b/)) return ServiceType.LCL;
  if (lower.match(/\bair\b/) || lower.match(/\bairfreight\b/))
    return ServiceType.AIR;

  return ServiceType.UNKNOWN;
}

/**
 * Extrae el incoterm del texto
 */
function extractIncoterm(text: string): Incoterm {
  const upper = text.toUpperCase();

  // Buscar incoterms comunes
  if (upper.match(/\bEXW\b/)) return Incoterm.EXW;
  if (upper.match(/\bFOB\b/)) return Incoterm.FOB;
  if (upper.match(/\bCIF\b/)) return Incoterm.CIF;
  if (upper.match(/\bDAP\b/)) return Incoterm.DAP;
  if (upper.match(/\bDDP\b/)) return Incoterm.DDP;

  return Incoterm.UNKNOWN;
}


//Busca patrones como "from Ciudad, País to Ciudad, País"
function extractRoute(text: string): {
  origin: Location;
  destination: Location;
} {
  // Patrón: "from Ciudad, País to Ciudad, País"
  const pattern =
    /from\s+([^,]+),\s*([^to]+?)\s+to\s+([^,]+),\s*([^\n.]+)/i;
  const match = text.match(pattern);

  if (match) {
    return {
      origin: {
        city: match[1].trim(),
        country: match[2].trim(),
      },
      destination: {
        city: match[3].trim(),
        country: match[4].trim(),
      },
    };
  }

  // Intentar patrón alternativo: "Origin: ... Destination: ..."
  const originPattern = /origin[:\s]+([^,]+),\s*([^\n]+)/i;
  const destPattern = /destination[:\s]+([^,]+),\s*([^\n]+)/i;

  const originMatch = text.match(originPattern);
  const destMatch = text.match(destPattern);

  return {
    origin: originMatch
      ? {
          city: originMatch[1].trim(),
          country: originMatch[2].trim(),
        }
      : { city: '', country: '' },
    destination: destMatch
      ? {
          city: destMatch[1].trim(),
          country: destMatch[2].trim(),
        }
      : { city: '', country: '' },
  };
}

/**
 * Extrae información de contenedores
 * Busca patrones como "1x40HC", "2 x 20ft", "3x40'HC"
 */
function extractContainers(text: string): Container[] {
  const containers: Container[] = [];

  // Patrón flexible para contenedores
  // Acepta: "1x40HC", "2 x 20'", "3x40ft", etc.
  const pattern = /(\d+)\s*x\s*(\d+(?:'|ft)?h?c?)\b/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const qty = parseInt(match[1]);
    let type = match[2].toUpperCase();

    // Normalizar el tipo de contenedor
    type = type.replace(/'/g, '').replace(/FT/i, '');

    containers.push({
      qty: qty,
      type: type,
    });
  }

  return containers;
}

/*
 Extrae el peso bruto
 */
function extractWeight(text: string): number | null {
  // Buscar patrones como "weight: 18,500 kg" o "18500kg" o "gross weight: 18.5 tons"
  const kgPattern = /(?:weight|gross)[:\s]+([\d,\.]+)\s*kg/i;
  const match = text.match(kgPattern);

  if (match) {
    // Limpiar comas y convertir a número
    const cleaned = match[1].replace(/,/g, '');
    return parseFloat(cleaned);
  }

  // Intentar buscar solo número seguido de kg
  const simplePattern = /([\d,\.]+)\s*kg/i;
  const simpleMatch = text.match(simplePattern);

  if (simpleMatch) {
    const cleaned = simpleMatch[1].replace(/,/g, '');
    return parseFloat(cleaned);
  }

  return null;
}

/*
  Extrae el volumen
 */
function extractVolume(text: string): number | null {
  // Buscar patrones como "volume: 58 cbm" o "58cbm" o "58 m3"
  const cbmPattern = /(?:volume[:\s]+)?([\d,\.]+)\s*(?:cbm|m3|m³)/i;
  const match = text.match(cbmPattern);

  if (match) {
    const cleaned = match[1].replace(/,/g, '');
    return parseFloat(cleaned);
  }

  return null;
}

/**
 * Extrae la fecha de disponibilidad
 * Maneja formatos ISO y fechas relativas
 */
function extractDate(text: string): string {
  // Primero buscar formato ISO: YYYY-MM-DD
  const isoPattern = /(\d{4}-\d{2}-\d{2})/;
  const isoMatch = text.match(isoPattern);
  if (isoMatch) return isoMatch[1];

  // Buscar "Ready date: ..." o "Available: ..."
  const datePattern = /(?:ready\s+date|available)[:\s]+(.+?)(?:\n|$)/i;
  const match = text.match(datePattern);

  if (match) {
    const dateStr = match[1].trim();

    // Retornar tal cual si es fecha relativa (el validador lo manejará)
    if (
      dateStr.toLowerCase().includes('next week') ||
      dateStr.toLowerCase().includes('tomorrow') ||
      dateStr.toLowerCase().includes('next month')
    ) {
      return dateStr;
    }

    return dateStr;
  }

  return 'unknown';
}

/**
 * Extrae shipper y consignee
 */
function extractParties(text: string): {
  shipper: string;
  consignee: string;
} {
  // Buscar "Shipper: nombre" o "Shipper: nombre de la empresa"
  const shipperPattern = /shipper[:\s]+(.+?)(?:\n|consignee|$)/i;
  const consigneePattern = /consignee[:\s]+(.+?)(?:\n|shipper|$)/i;

  const shipperMatch = text.match(shipperPattern);
  const consigneeMatch = text.match(consigneePattern);

  return {
    shipper: shipperMatch ? shipperMatch[1].trim() : '',
    consignee: consigneeMatch ? consigneeMatch[1].trim() : '',
  };
}

/**
 * Extrae la descripción de la mercancía
 */
function extractCommodity(text: string): string {
  // Buscar "Commodity: descripción"
  const commodityPattern = /commodity[:\s]+(.+?)(?:\n|$)/i;
  const match = text.match(commodityPattern);

  if (match) {
    return match[1].trim();
  }

  return '';
}

/**
 * Normaliza el texto para facilitar el procesamiento
 */
function normalizeText(text: string): string {
  // Normalizar saltos de línea Windows/Mac/Linux
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}