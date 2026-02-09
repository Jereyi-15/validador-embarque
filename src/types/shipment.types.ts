// Enums
export enum TransportMode {
  OCEAN = 'ocean',
  AIR = 'air',
  GROUND = 'ground',
  UNKNOWN = 'unknown'
}

export enum ServiceType {
  FCL = 'FCL',
  LCL = 'LCL',
  AIR = 'AIR',
  UNKNOWN = 'unknown'
}

export enum Incoterm {
  EXW = 'EXW',
  FOB = 'FOB',
  CIF = 'CIF',
  DAP = 'DAP',
  DDP = 'DDP',
  UNKNOWN = 'unknown'
}

// Interface de la ubicación (origen o destino)
export interface Location {
  city: string;
  country: string;
}

// Interface para detalles de contenedor (para FCL/LCL)
export interface Container {
  type: string;
  qty: number;
}

// Interface para detalles de carga
export interface Cargo {
  commodity: string;
  pieces: number | null;
  gross_weight_kg: number | null;
  volume_cbm: number | null;
  containers: Container[];
}

// Interface para las partes involucradas en el embarque
export interface Parties {
  shipper: string;
  consignee: string;
}

// Interface con datos principales de embarque
export interface Shipment {
  mode: TransportMode;
  service: ServiceType;
  incoterm: Incoterm;
  origin: Location;
  destination: Location;
  ready_date: string;
  cargo: Cargo;
  parties: Parties;
}

// Interface para la fuente de datos de la respuesta
export interface Source {
  channel: string;
  subject: string;
  received_text_file: string;
}

// Interface para validación de advertencias y errores criticos
export interface Validation {
  errors: string[];
  warnings: string[];
}

// Interface de embarque completa
export interface ShipmentData {
  source: Source;
  shipment: Shipment;
  validation: Validation;
}