// Remplace react-native-device-info (voir metro.config.js).
// sp-react-native-in-app-updates en dépend uniquement pour lire la version de l'app, et ce module
// natif n'est pas lié à l'app (dépendance indirecte) : l'importer fait planter l'app au démarrage.
const { version } = require('../../package.json');

module.exports = {
  getVersion: () => version,
  getBundleId: () => 'com.historyvoice',
};
