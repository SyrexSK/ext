import HistoryPage from '../pages/history.vue';
import OverviewPage from '../pages/index.vue';
import { PRODUCT_NAME } from '../constants';

const routes = [
  {
    name: `c-cluster-${ PRODUCT_NAME }`,
    path: `/c/:cluster/${ PRODUCT_NAME }`,
    redirect: {
      name: `c-cluster-${ PRODUCT_NAME }-overview`,
    },
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME,
    },
  },
  {
    name: `c-cluster-${ PRODUCT_NAME }-overview`,
    path: `/c/:cluster/${ PRODUCT_NAME }/overview`,
    component: OverviewPage,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME,
    },
  },
  {
    name: `c-cluster-${ PRODUCT_NAME }-history`,
    path: `/c/:cluster/${ PRODUCT_NAME }/history`,
    component: HistoryPage,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME,
    },
  },
];

export default routes;
