import * as fs from 'fs';
import * as path from 'path';
import { ShipmentData } from '../types/shipment.types';


//Lee un archivo de texto y devuelve su contenido
export function readTextFile(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Error reading file ${filePath}: ${error}`);
  }
}


//Escribe un objeto como JSON en un archivo
export function writeJsonFile(filePath: string, data: ShipmentData): void {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');
  } catch (error) {
    throw new Error(`Error writing file ${filePath}: ${error}`);
  }
}


//Obtiene todos los archivos .txt de un directorio
export function getTextFiles(directoryPath: string): string[] {
  try {
    const files = fs.readdirSync(directoryPath);
    return files
      .filter((file) => file.endsWith('.txt'))
      .map((file) => path.join(directoryPath, file));
  } catch (error) {
    throw new Error(`Error reading directory ${directoryPath}: ${error}`);
  }
}

//Verifica si un directorio existe, si no, lo crea
export function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

//Obtiene el nombre del archivo sin la ruta ni extensión
export function getFileNameWithoutExtension(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

//Genera el path de salida para un archivo JSON
export function getOutputPath(
  inputFilePath: string,
  outputDirectory: string
): string {
  const fileName = getFileNameWithoutExtension(inputFilePath);
  return path.join(outputDirectory, `${fileName}.json`);
}

//Lee todos los archivos de un directorio y los procesa, para hacer todos los tests de una vez 
export function processAllTextFiles(
  inputDir: string,
  outputDir: string,
  processFunction: (content: string, filename: string) => ShipmentData
): { processed: number; errors: number } {
  ensureDirectoryExists(outputDir);

  const files = getTextFiles(inputDir);
  let processed = 0;
  let errors = 0;

  files.forEach((filePath) => {
    try {
      const content = readTextFile(filePath);
      const filename = path.basename(filePath);
      const data = processFunction(content, filename);

      const outputPath = getOutputPath(filePath, outputDir);
      writeJsonFile(outputPath, data);

      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      errors++;
    }
  });

  return { processed, errors };
}