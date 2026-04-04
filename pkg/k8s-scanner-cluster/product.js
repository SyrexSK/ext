import { PRODUCT_NAME } from './constants';

export function init($plugin, store) {
  const {
    basicType,
    product,
    virtualType,
  } = $plugin.DSL(store, PRODUCT_NAME);

  product({
    icon: 'pod',
    inStore: 'cluster',
    removable: false,
    weight: 100,
    to: {
      name: `c-cluster-${ PRODUCT_NAME }-overview`,
      params: {
        product: PRODUCT_NAME,
      },
    },
  });

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'overview',
    route:      {
      name:   `c-cluster-${ PRODUCT_NAME }-overview`,
      params: {
        product: PRODUCT_NAME,
      },
    },
    exact:      true,
    weight:     100,
    overview:   true,
  });

  virtualType({
    label:      'History',
    namespaced: false,
    name:       'history',
    route:      {
      name:   `c-cluster-${ PRODUCT_NAME }-history`,
      params: {
        product: PRODUCT_NAME,
      },
    },
    exact:      true,
    weight:     99,
  });

  basicType(['overview', 'history']);
}

export default init;
