import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Syntax from './views/Syntax.vue';
import Api from './views/Api.vue';
import Playground from './views/Playground.vue';
import About from './views/About.vue'; // <-- Import About

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/syntax', component: Syntax },
    { path: '/api', component: Api },
    { path: '/playground', component: Playground },
    { path: '/about', component: About }, // <-- Daftarkan rute
  ],
});
export default router;