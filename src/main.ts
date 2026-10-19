/**
 * 应用入口：Arco + Pinia + Router，并挂载 axios 拦截器。
 */
import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';

import '@arco-design/web-vue/dist/arco.css';
import '@/assets/style/global.less';
import '@/api/interceptor';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';

const app = createApp(App);

app.use(ArcoVue);
app.use(store);
app.use(router);
app.mount('#app');
