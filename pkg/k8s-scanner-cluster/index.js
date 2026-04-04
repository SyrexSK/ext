import product from './product';
import extensionRouting from './routing/extension-routing';

export default function(plugin, internal) {
  plugin.metadata = require('./package.json');
  plugin.addProduct(product);
  plugin.addRoutes(extensionRouting);
}
