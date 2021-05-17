import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

Vue.config.productionTip = false

Vue.prototype.$axios = axios;
Vue.prototype.serverHost = 'http://172.30.1.33:7777';

new Vue({
  router,
  render: h => h(App),
  beforeCreate() {
    //service worker register
    if('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then( () => {
            console.log('Service worker registered!');
        })
        .catch( err => {
          console.log(err);
        });
    }
  }
}).$mount('#app')
