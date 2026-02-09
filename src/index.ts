import * as path from 'path';
import { parseEmail } from './parsers/emailParser';
import { validateShipment, getValidationSummary } from './validators/shiptmentValidator';
import { processAllTextFiles } from './utils/fileUtils';

// Rutas de entrada y salida
const SAMPLES_DIR = path.join(__dirname, '..', 'samples');
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

console.log('Validador de Embarques iniciando\n');

// Función de procesamiento que combina parsing y validación
function processEmail(content: string, filename: string) {
  console.log(`Procesando: ${filename}`);
  
  // 1. Parsear el correo
  const shipmentData = parseEmail(content, filename);
  
  // 2. Validar los datos extraídos
  validateShipment(shipmentData);
  
  // 3. Mostrar resumen de validación
  const summary = getValidationSummary(shipmentData);
  console.log(`   ${summary.split('\n').join('\n   ')}`);
  console.log('');
  
  return shipmentData;
}

// Procesar todos los archivos .txt en samples/
const result = processAllTextFiles(SAMPLES_DIR, OUTPUTS_DIR, processEmail);

// Mostrar resumen final
console.log('Procesamiento completado:');
console.log(`   - Archivos procesados: ${result.processed}`);
console.log(`   - Errores: ${result.errors}`);
