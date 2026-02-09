# Validador de Embarques

Sistema de extracción y validación automatizada de solicitudes de embarque a partir de correos electrónicos en texto plano.

## Descripción del Proyecto

Este mini-servicio procesa correos electrónicos de solicitudes de embarque (formato .txt), extrae información clave mediante expresiones regulares y técnicas de parsing, y genera archivos JSON estandarizados con validaciones automáticas que identifican errores bloqueantes y advertencias.

El flujo representa un caso de uso real en logística internacional:

```
Correo de texto (.txt) → Extracción → Validación → JSON estandarizado
```

## Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución JavaScript
- **TypeScript**: Superset tipado de JavaScript para mayor robustez
- **ts-node**: Ejecución directa de TypeScript sin compilación previa (desarrollo)

### Dependencias

```json
{
  "@types/node": "^20.x.x",
  "ts-node": "^10.x.x",
  "typescript": "^5.x.x"
}
```

## Estructura del Proyecto

```
validador-embarque/
├── src/
│   ├── index.ts                    # Punto de entrada principal
│   ├── tests/                  # Tests unitarios y de integración
│   │   ├── emailParser.test.ts
│   │   └── shipmentValidator.test.ts
│   ├── parsers/
│   │   └── emailParser.ts          # Lógica de extracción de datos
│   ├── validators/
│   │   └── shipmentValidator.ts    # Reglas de validación
│   ├── types/
│   │   └── shipment.types.ts       # Definiciones TypeScript
│   └── utils/
│       └── fileUtils.ts            # Utilidades de lectura/escritura
├── samples/                        # Correos de prueba (.txt)
├── outputs/                        # JSONs generados (.json)
├── jest.config.js                  # Configuración de Jest
├── package.json
├── tsconfig.json
└── README.md
```

## Instalación

### Requisitos Previos

- Node.js (versión 18 o superior) en https://nodejs.org/en/download
- npm (viene incluido con Node.js)

### Pasos

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd validador-embarque
```

2. Instalar dependencias:
```bash
npm install
```

## Uso

### Ejecutar el Procesamiento

Para procesar todos los archivos .txt en la carpeta `samples/` y generar los JSON correspondientes en `outputs/`:

```bash
npm run dev
```

### Salida Esperada

El sistema procesará cada archivo y mostrará en consola:

```
Validador de Embarques iniciando

Procesando: email1-complete-fcl.txt
   Validation passed - No errors or warnings

Procesando: email2-air-complete.txt
   Validation passed - No errors or warnings

Procesando: email3-incomplete.txt
   4 Error(s):
      1. Origin location is missing or incomplete
      2. Destination location is missing or incomplete
      3. Transport mode could not be determined
      4. Shipper information is missing
   6 Warning(s):
      1. Incoterm could not be determined or is not standard
      2. Ready date is relative or unknown: "next week"
      ...

Procesamiento completado:
   - Archivos procesados: 4
   - Errores: 0
```

Los archivos JSON generados estarán disponibles en la carpeta `outputs/` con el mismo nombre base que el archivo de entrada.

## Agregar Más Correos de Prueba

1. Crear un nuevo archivo .txt en la carpeta `samples/`:

2. Agregar el contenido del correo siguiendo el formato esperado:

```
Subject: Mi asunto

Body:
Descripción del embarque...

3. Ejecutar el procesamiento:

```bash
npm run dev
```

4. El JSON correspondiente se generará automáticamente en `outputs/mi-nuevo-correo.json`

### Formatos de Correo Soportados

El parser reconoce múltiples formatos de entrada:

**Formato 1: Ruta en una línea**
```
Please quote for 1x40HC from San Jose, Costa Rica to Rotterdam, NL.
```

**Formato 2: Campos separados con etiquetas**
```
From: Shanghai, China
To: Los Angeles, USA
Commodity: Electronics
Incoterm: DDP
```

**Formato 3: Campos con dos puntos**
```
Origin: Miami, USA
Destination: Sao Paulo, Brazil
Ready date: 2026-02-15
```

## Estructura del JSON Generado

Cada correo procesado genera un archivo JSON con la siguiente estructura:

```json
{
  "source": {
    "channel": "email",
    "subject": "Asunto del correo",
    "received_text_file": "nombre-archivo.txt"
  },
  "shipment": {
    "mode": "ocean|air|ground|unknown",
    "service": "FCL|LCL|AIR|unknown",
    "incoterm": "EXW|FOB|CIF|DAP|DDP|unknown",
    "origin": {
      "city": "Ciudad Origen",
      "country": "País Origen"
    },
    "destination": {
      "city": "Ciudad Destino",
      "country": "País Destino"
    },
    "ready_date": "YYYY-MM-DD|unknown",
    "cargo": {
      "commodity": "Descripción de la mercancía",
      "pieces": null,
      "gross_weight_kg": 18500,
      "volume_cbm": 58,
      "containers": [
        { "qty": 1, "type": "40HC" }
      ]
    },
    "parties": {
      "shipper": "Nombre del exportador",
      "consignee": "Nombre del importador"
    }
  },
  "validation": {
    "errors": [],
    "warnings": []
  }
}
```

## Sistema de Validación

### Errores Bloqueantes

Impiden el procesamiento operativo del embarque:

1. **Origen vacío o incompleto**: Falta ciudad o país de origen
2. **Destino vacío o incompleto**: Falta ciudad o país de destino
3. **Modo de transporte desconocido**: No se pudo determinar si es ocean/air/ground
4. **Shipper no identificado**: Falta información del exportador

### Advertencias (No Bloqueantes)

Indican información faltante o imprecisa que debe revisarse:

1. **Incoterm desconocido**: No se encontró un incoterm estándar
2. **Fecha relativa**: La fecha usa términos como "next week", "tomorrow"
3. **Commodity vacío**: No se especificó la descripción de la mercancía
Extras
4. **Consignee faltante**: No se identificó al importador
5. **Peso faltante**: No se especificó el peso bruto
6. **Volumen faltante**: No se especificó el volumen
7. **Contenedores vacíos**: Para embarques FCL/LCL no se identificaron contenedores
8. **Servicio desconocido**: No se pudo determinar el tipo de servicio

## Lógica de Extracción

### Modo de Transporte

El sistema infiere el modo de transporte basándose en palabras clave:

- **Ocean**: Detecta "FCL", "LCL", "ocean", "sea", "container", "40HC", "20ft"
- **Air**: Detecta "air", "flight", "airfreight"
- **Ground**: Detecta "LTL", "FTL", "truck", "ground", "road"

### Contenedores

Reconoce patrones como:
- `1x40HC`
- `2 x 20ft`
- `3x40'HC`

Y extrae la cantidad y tipo de contenedor.

### Peso y Volumen

Busca números seguidos de unidades:
- Peso: `18,500 kg` o `18500kg`
- Volumen: `58 cbm`, `58 m3`, `58 m³`

### Fechas

Soporta:
- Formato ISO: `2026-02-20`
- Fechas relativas: "next week", "tomorrow" (genera warning)

## Casos de Prueba Incluidos

El proyecto incluye 4 correos de ejemplo en `samples/`:

### 1. email1-complete-fcl.txt
Embarque FCL completo y válido. Todos los campos presentes.
- Resultado: Sin errores ni warnings

### 2. email2-air-complete.txt
Embarque aéreo completo con incoterm DDP.
- Resultado: Sin errores ni warnings

### 3. email3-incomplete.txt
Correo intencionalmente incompleto para demostrar validaciones.
- Resultado: 4 errores, 6 warnings

### 4. email4-lcl-warnings.txt
Embarque LCL con información parcial.
- Resultado: Sin errores, 4 warnings

## Compilación (Opcional)

Para generar JavaScript compilado:

```bash
npm run build
```

Esto creará los archivos .js en la carpeta `dist/`.

Para ejecutar la versión compilada:

```bash
npm start
```

## Notas Técnicas

### Parsing de Texto Libre

El sistema utiliza expresiones regulares para extraer información de texto no estructurado. Debido a la naturaleza variable de los correos electrónicos, el parsing puede no ser 100% preciso en todos los casos. Se han implementado múltiples patrones de búsqueda para maximizar la tasa de extracción exitosa.

### Inferencia de Modo de Transporte

El modo de transporte se infiere a partir de palabras clave contextuales. Por ejemplo, "FCL" y "40HC" indican transporte marítimo aunque no se mencione explícitamente "ocean" en el correo, al igual que en transporte terrestre.

### Normalización de Datos

El sistema normaliza automáticamente:
- Saltos de línea (Windows/Mac/Linux)
- Espacios extra en campos extraídos
- Números con comas en peso y volumen
- Tipos de contenedores (remueve comillas y "ft")

## Decisiones de Diseño

1. **Separación de responsabilidades**: Parser, validador y utilidades están en módulos independientes para facilitar mantenimiento y testing.

2. **Validaciones extensivas**: Se implementaron validaciones adicionales más allá de las mínimas requeridas para ofrecer mayor valor en casos reales.

3. **Múltiples patrones de parsing**: Se soportan 3 formatos diferentes de rutas (from...to, Origin/Destination, From:/To:) para maximizar compatibilidad.

4. **Tipos TypeScript**: Uso de enums y tipos definidos para mayor seguridad de tipos y autocompletado.

5. **Procesamiento por lotes**: El sistema procesa automáticamente todos los .txt en samples/, ideal para validación de múltiples correos.

## Limitaciones Conocidas

- El parsing depende de patrones de texto específicos. Correos con formato muy diferente pueden no extraerse correctamente.
- No se soporta parsing de archivos adjuntos ni HTML.
- Las fechas relativas (mañana, ayer, dentro de una semana, etc) se detectan pero no se convierten a fechas absolutas.
- No hay persistencia en base de datos, solo generación de archivos JSON en este mini servicio.
## Tests

El proyecto incluye tests unitarios y de integración para validar el comportamiento del parser y validador. Los tests están organizados en la carpeta `src/tests/`.

### Ejecutar Tests

```bash
npm test
```

### Ejecutar Tests en Modo Watch

```bash
npm run test:watch
```

### Tipos de Tests Implementados

El proyecto diferencia entre dos tipos de tests:

#### Tests Unitarios Puros
Prueban funciones individuales de forma aislada con entradas controladas. Cada función se prueba independientemente sin depender de otras funciones.

**Ubicación:** `src/tests/emailParser.unit.test.ts`

**Ejemplos:**
- `extractMode('FCL shipment')` → Debe retornar `TransportMode.OCEAN`
- `extractContainers('2x40HC')` → Debe retornar `[{qty: 2, type: '40HC'}]`
- `extractWeight('5000kg')` → Debe retornar `5000`

**Ventajas:**
- Rápidos de ejecutar
- Fáciles de debuggear
- Identifican exactamente qué función falla
- Útiles para probar lógica de parsing específica

#### Tests de Integración
Prueban el flujo completo de múltiples funciones trabajando juntas. Simulan casos de uso reales.

**Ubicación:** `src/tests/emailParser.test.ts` y `src/tests/shipmentValidator.test.ts`

**Ejemplos:**
- `parseEmail(emailCompleto)` → Prueba todo el pipeline de extracción
- `validateShipment(shipmentData)` → Prueba todas las reglas de validación

**Ventajas:**
- Prueban el sistema como lo usa el usuario
- Detectan problemas de integración entre funciones
- Más realistas y valiosos para casos de producción

### Estructura de Tests

Los archivos de test están ubicados en `src/tests/`:
- `emailParser.unit.test.ts` - **Tests unitarios** de funciones individuales del parser (10 tests)
- `emailParser.test.ts` - **Tests de integración** del parser completo con validación (5 tests)

**Total: 15 tests** cubriendo casos unitarios y de integración end-to-end.

### Casos de Prueba

**Tests Unitarios (src/tests/emailParser.unit.test.ts):**

Prueban funciones individuales de forma aislada:
- **extractMode**: Detección de OCEAN (FCL/LCL), AIR (airfreight), y UNKNOWN
- **extractService**: Identificación de FCL y LCL
- **extractRoute**: Parsing de rutas "from...to" y casos sin match
- **extractContainers**: Extracción de contenedores simples (1x40HC) y múltiples (2x40HC + 1x20ft)
- **extractWeight**: Parsing de peso con separadores y casos sin peso

**Tests de Integración (src/tests/emailParser.test.ts):**

Prueban el flujo completo según requisitos de la evaluación:

1. **Correo FCL completo** - Sin errores ni warnings
   - Todos los campos extraídos correctamente
   - Validación exitosa

2. **Correo AIR completo** - Sin errores ni warnings
   - Transporte aéreo con formato alternativo
   - Validación exitosa

3. **Correo incompleto crítico** - Con errores bloqueantes
   - Falta origen, modo de transporte, y shipper
   - Genera 3+ errores bloqueantes

4. **Correo sin destino** - Con errores parciales
   - Tiene modo y shipper pero falta origen y destino
   - Genera 2 errores de ubicación

5. **Correo con fecha relativa** - Con warnings
   - Fecha "next week" genera warning
   - Sin errores bloqueantes pero con advertencias

## Limitaciones y Próximos Pasos
- extractContainers: Extracción de especificaciones de contenedores
- extractWeight: Parsing de peso en diferentes formatos
- extractVolume: Parsing de volumen en CBM/m³

**Parser Integración (src/tests/emailParser.test.ts):**
- Parsing completo de embarque FCL
- Parsing de transporte aéreo con formato alternativo
5. **Correo con fecha relativa** - Con warnings
   - Fecha "next week" genera warning
   - Sin errores bloqueantes pero con advertencias

## Limitaciones y Próximos Pasos

### Limitaciones Actuales

1. **Dependencia de expresiones regulares**: El parsing se basa en patrones regex muy específicos, lo que limita la flexibilidad para formatos de correo muy variables o con estructura inesperada, como los que podríamos encontrar en un entorno de producción real. Correos con redacción muy informal o con múltiples idiomas pueden fallar en la extracción.

2. **Fechas relativas no resueltas**: El sistema detecta fechas relativas como "next week", "tomorrow", "mañana" pero no las convierte a fechas absolutas. Esto requiere contexto de cuándo se recibió el correo y lógica adicional para calcular la fecha real.

3. **Sin soporte para formatos ricos**: No se procesan correos en formato HTML, archivos adjuntos con información relevante (PDFs, Excel), ni imágenes con datos del embarque. Solo se parsea texto plano.

4. **Idioma único**: Los patrones de extracción están optimizados para inglés. Correos en español, portugués u otros idiomas pueden no extraerse correctamente sin adaptación de los patrones.

5. **Ausencia de persistencia**: Los datos procesados solo se almacenan como archivos JSON individuales. No hay base de datos, histórico de procesamiento, ni capacidad de búsqueda o agregación.

### Próximos Pasos para Producción

1. **Machine Learning para parsing**: Implementar un modelo de NLP (Natural Language Processing) entrenado con correos reales para extraer entidades y relaciones de forma más robusta, reduciendo la dependencia de regex y agregando el valor de entender el contexto del correo.

2. **API REST con validación asíncrona**: Transformar el script CLI en una API REST (usando Express ene este caso de Node) que permita:
   - Subir correos vía POST multipart/form-data
   - Procesar de forma asíncrona con colas (Redis)
   - Webhooks para notificar cuando el procesamiento termine
   - Endpoints para consultar estado y resultados
Esto generaría un gran valor y escalabilidad al servicio y al cliente.

3. **Persistencia en base de datos**: Integrar una base de datos para:
   - Almacenar todos los embarques procesados con mayor información
   - Mantener histórico de validaciones
   - Permitir búsquedas por shipper, destino, fecha, estado
   - Dashboard de estadísticas (embarques por mes, errores más comunes)

4. **Normalización de datos con servicios externos**: Integrar APIs de terceros para validar y normalizar:
   - Códigos de aeropuertos/puertos (IATA/UN/LOCODE)
   - Nombres de países y ciudades (GeoNames API)
   - Validación de incoterms contra lista oficial ICC
   - Conversión de fechas relativas usando la fecha de recepción del correo

5. **Soporte multiidioma**: Expandir patrones de extracción para español, portugués, alemán, chino y otros idiomas comunes en logística internacional, con detección automática de idioma.