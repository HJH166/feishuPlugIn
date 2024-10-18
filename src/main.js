/*
 * @Author: hejiahao_tech@163.com hejiahao_tech@163.com
 * @Date: 2024-10-13 16:27:25
 * @LastEditors: hejiahao_tech@163.com hejiahao_tech@163.com
 * @LastEditTime: 2024-10-13 16:31:23
 * @FilePath: \chrome-extensiond:\workSpace\web\Hello-world-Ji-Lu\src\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from 'vue'
import App from './App.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// import {i18n} from './locales/i18n.js'
// createApp(App).use(i18n).mount('#app') // 注入国际化函数$t

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
