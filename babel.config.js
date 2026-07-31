module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  const plugins = [];

  if (isProduction) {
    // Eliminar todos los console.log/warn/error del bundle de producción
    // Así nadie puede ver trazas de la lógica interna
    plugins.push(['transform-remove-console', { exclude: [] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
