import {
  ShipmentData,
  TransportMode,
  Incoterm,
} from '../types/shipment.types';


 //Valida un objeto ShipmentData y llena los arrays de errores y warnings
 //Modifica el objeto directamente

export function validateShipment(data: ShipmentData): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  //Bloqueantes
  // 1. Validar origen vacio
  if (!data.shipment.origin.city || !data.shipment.origin.country) {
    errors.push('Origin location is missing or incomplete');
  }
  // 2. Validar destino vacio
  if (!data.shipment.destination.city || !data.shipment.destination.country) {
    errors.push('Destination location is missing or incomplete');
  }
  // 3. Validar modo de transporte desconocido
  if (data.shipment.mode === TransportMode.UNKNOWN) {
    errors.push('Transport mode could not be determined');
  }

  // 4. Validar shipper vacio
  if (!data.shipment.parties.shipper || data.shipment.parties.shipper === '') {
    errors.push('Shipper information is missing');
  }

  // No bloqueantes
  // 1. Incoterm desconocido
  if (data.shipment.incoterm === Incoterm.UNKNOWN) {
    warnings.push('Incoterm could not be determined or is not standard');
  }

  // 2. Fecha relativa o desconocida
  if (
    data.shipment.ready_date === 'unknown' ||
    isRelativeDate(data.shipment.ready_date)
  ) {
    warnings.push(
      `Ready date is relative or unknown: "${data.shipment.ready_date}"`
    );
  }

  // 3. Commodity vacío
  if (!data.shipment.cargo.commodity || data.shipment.cargo.commodity === '') {
    warnings.push('Commodity description is missing');
  }

  // 4. Consignee vacío (warning, no error)
  if (
    !data.shipment.parties.consignee ||
    data.shipment.parties.consignee === ''
  ) {
    warnings.push('Consignee information is missing');
  }

  // 5. Peso o volumen faltantes
  if (data.shipment.cargo.gross_weight_kg === null) {
    warnings.push('Gross weight information is missing');
  }

  if (data.shipment.cargo.volume_cbm === null) {
    warnings.push('Volume information is missing');
  }

  // 6. Contenedores vacíos (para FCL/LCL)
  if (
    (data.shipment.service === 'FCL' || data.shipment.service === 'LCL') &&
    data.shipment.cargo.containers.length === 0
  ) {
    warnings.push('Container information is missing for ocean shipment');
  }

  // 7. Servicio desconocido
  if (data.shipment.service === 'unknown') {
    warnings.push('Service type could not be determined');
  }

  // Asignar errores y warnings al objeto
  data.validation.errors = errors;
  data.validation.warnings = warnings;
}

/*
 * Verifica si una fecha es relativa (next week, tomorrow, etc.)
 */
function isRelativeDate(dateStr: string): boolean {
  const relativeDateKeywords = [
    'next week',
    'next month',
    'tomorrow',
    'today',
    'next',
    'this week',
    'this month',
  ];

  const lower = dateStr.toLowerCase();
  return relativeDateKeywords.some((keyword) => lower.includes(keyword));
}

/*
 * Devuelve un resumen de la validación en formato texto
 */
export function getValidationSummary(data: ShipmentData): string {
  const errorCount = data.validation.errors.length;
  const warningCount = data.validation.warnings.length;

  if (errorCount === 0 && warningCount === 0) {
    return 'Validation passed - No errors or warnings';
  }

  let summary = '';

  if (errorCount > 0) {
    summary += `${errorCount} Error(s):\n`;
    data.validation.errors.forEach((error, index) => {
      summary += `   ${index + 1}. ${error}\n`;
    });
  }

  if (warningCount > 0) {
    summary += `${warningCount} Warning(s):\n`;
    data.validation.warnings.forEach((warning, index) => {
      summary += `   ${index + 1}. ${warning}\n`;
    });
  }

  return summary.trim();
}