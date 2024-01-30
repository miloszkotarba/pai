import '@fontsource/roboto/index.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    icons: { iconfont: 'mdi' }
})

// Router
import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from './components/Dashboard.vue'
import ControlPanel from './components/ControlPanel.vue'
import Chat from './components/Chat.vue'
import PersonsLister from './components/PersonsLister.vue'
import ProjectsLister from './components/ProjectsLister.vue'
import TasksLister from "@/components/TasksLister.vue";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', component: Dashboard },
        { path: '/control', component: ControlPanel },
        { path: '/chat', component: Chat },
        { path: '/persons', component: PersonsLister },
        { path: '/projects', component: ProjectsLister },
        { path: '/tasks', component: TasksLister },
    ]
})

createApp(App).use(vuetify).use(router).mount('#app')