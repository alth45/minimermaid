import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Syntax from './views/Syntax.vue';
import Api from './views/Api.vue';
import Playground from './views/Playground.vue';
import About from './views/About.vue';
import Swimlane from './views/Swimlane.vue';
import Sequence from './views/Sequence.vue';
// Import halaman contoh proyek
import ExEcommerce from './views/ExEcommerce.vue';
import ExSoftware from './views/ExSoftware.vue';
import ExUML from './views/ExUML.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/syntax', component: Syntax },
    { path: '/swimlane', component: Swimlane },
    { path: '/sequence', component: Sequence },
    // Rute Contoh Proyek
    { path: '/examples/ecommerce', component: ExEcommerce },
    { path: '/examples/software', component: ExSoftware },
    { path: '/examples/uml', component: ExUML },
    // Referensi
    { path: '/api', component: Api },
    { path: '/playground', component: Playground },
    { path: '/about', component: About },
  ],
});
export default router;