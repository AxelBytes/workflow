/**
 * Metro transformer personalizado con ofuscación JavaScript.
 * Solo se activa en builds de producción (NODE_ENV=production).
 * En desarrollo, usa el transformer por defecto para no afectar velocidad.
 */

// `babelTransformerPath` espera un transformer que trabaje sobre el AST de
// Babel (entrada: código fuente -> salida: {ast, metadata}), no sobre el
// "file transform" completo de Metro (build/transform-worker), que además
// espera un shape de opciones distinto y no existe con ese nombre en este
// SDK de Expo. El transformer de babel correcto es este:
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');
const JavaScriptObfuscator = require('javascript-obfuscator');
const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');

// IMPORTANTE: Metro necesita poder leer, para cada archivo, los argumentos de
// `require("literal")` como strings/números literales reales para poder
// armar el grafo de dependencias del bundle (lo hace sobre el AST que
// devolvemos acá, después de ofuscar). Cualquier técnica de
// javascript-obfuscator que "esconda" o reescriba literales dentro de
// expresiones/llamadas —stringArray, controlFlowFlattening,
// deadCodeInjection, numbersToExpressions— puede terminar mutando también el
// argumento de un require real (por ejemplo los `require('./assets/x.png')`
// de assets), y entonces Metro tira "Invalid call ... require(...)" y el
// build entero falla. Probado en este proyecto: con cualquiera de esas 4
// activas, el export de producción rompe en al menos un archivo. Por eso acá
// solo se aplican transformaciones que jamás tocan literales de argumentos de
// llamada: renombrado de identificadores + compactado. Sigue siendo una capa
// real de ofuscación (nombres de variables/funciones sin significado) sumada
// a Hermes (bytecode) + ProGuard/R8 (nativo Android) + anti-tampering en
// runtime, que son las protecciones fuertes reales del proyecto.
const OBFUSCATION_CONFIG = {
  compact: true,

  stringArray: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  numbersToExpressions: false,

  // Renombrar identificadores a hex (a1b2c3 en lugar de totalPoints)
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,         // NUNCA renombrar globals — rompe React Native
  renameProperties: false,      // NUNCA renombrar propiedades — rompe metro

  // Transformar objetos literales
  transformObjectKeys: false,   // off — puede romper React Native internals

  // Eliminar comentarios y debugger statements
  disableConsoleOutput: true,
  debugProtection: false,       // off — puede causar bucles infinitos
  selfDefending: false,         // off — incompatible con Hermes bytecode

  sourceMap: false,
  log: false,
};

// Archivos que NO se deben ofuscar (internals de React Native y dependencias)
const EXCLUDED_PATHS = [
  'node_modules',
  '__prelude__',
  'InitializeCore',
  'react-native/Libraries',
  'hermes',
];

module.exports.transform = async function transform(props) {
  const { filename } = props;
  const isProduction = process.env.NODE_ENV === 'production';

  // Primero aplicar la transformación estándar de Expo (JSX/TS -> AST de JS plano)
  const result = await upstreamTransformer.transform(props);

  // Solo ofuscar en producción y solo archivos de la app (no node_modules)
  const shouldObfuscate =
    isProduction &&
    result.ast &&
    !EXCLUDED_PATHS.some((p) => filename.includes(p)) &&
    (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.tsx'));

  if (!shouldObfuscate) return result;

  try {
    // El contrato de babelTransformerPath trabaja con AST, no con strings de
    // código: generamos código desde el AST ya transpilado, lo ofuscamos, y
    // volvemos a parsearlo a AST para devolvérselo a Metro. Se pierde el
    // source map de este paso a propósito (código ofuscado no debe ser
    // legible ni siquiera con sourcemaps).
    const { code } = generate(result.ast, { comments: false, compact: false });
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_CONFIG).getObfuscatedCode();
    const newAst = parse(obfuscatedCode, { sourceType: 'unambiguous' });
    return { ...result, ast: newAst };
  } catch {
    // Si la ofuscación falla en un archivo específico, devolver el original
    // (mejor que romper el build)
    return result;
  }
};
