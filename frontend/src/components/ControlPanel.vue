<template>
    <div>
        <h1>Control Panel</h1>
        <br/>

        <v-card>
            <v-card-title>
                <v-btn variant="elevated" color="default" @click="refreshSessions" icon="mdi-refresh" density="compact"></v-btn>
                Sessions
            </v-card-title>
            <v-card-text>
                <v-table density="compact" hover>
                    <thead>
                        <tr>
                        <th class="text-left">
                            sessionid
                        </th>
                        <th class="text-left">
                            user
                        </th>
                        <th class="text-left">
                            roles
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(session, key, index) in sessions" :key="index">
                        <td>{{ key }}</td>
                        <td>{{ session.passport && session.passport.user }}</td>
                        <td>{{ session.roles }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

        <v-card>
            <v-card-title>
                <v-btn variant="elevated" color="default" @click="refreshSockets" icon="mdi-refresh" density="compact"></v-btn>
                Sockets
            </v-card-title>
            <v-card-text>
                <v-table density="compact" hover>
                    <thead>
                        <tr>
                        <th class="text-left">
                            sessionid
                        </th>
                        <th class="text-left">
                            address
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(socket, key, index) in sockets" :key="index">
                        <td>{{ socket.sessionid }}</td>
                        <td>{{ socket.from.family + '/' + socket.from.address + ':' + socket.from.port }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

        <v-card>
            <v-card-title>
                <v-btn variant="elevated" color="default" @click="refreshUsers" icon="mdi-refresh" density="compact"></v-btn>
                Users
            </v-card-title>
            <v-card-text>
                <v-table density="compact" hover>
                    <thead>
                        <tr>
                        <th class="text-left">
                            username
                        </th>
                        <th class="text-left">
                            roles
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, key, index) in users" :key="index">
                        <td>{{ user.username }}</td>
                        <td>{{ user.roles }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

        <v-card>
            <v-card-title>
                <v-btn variant="elevated" color="default" @click="refreshDatabase" icon="mdi-refresh" density="compact"></v-btn>
                Database
            </v-card-title>
            <v-card-text>
                <v-table density="compact" hover>
                    <thead>
                        <tr>
                        <th class="text-left">
                            collection
                        </th>
                        <th class="text-left">
                            size
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(counter, key, index) in database" :key="index">
                        <td>{{ key }}</td>
                        <td>{{ counter }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

    </div>
</template>
  
<script>
export default {
    name: 'ControlPanel',
    props: [ 'user', 'websocket', 'eventSet' ],
    data() {
        return {
            sessions: {},
            sockets: [],
            users: [],
            database: {}
        }
    },
    methods: {
        refreshSessions() {
            fetch('/control/sessions', { method: 'GET' })
            .then(res => res.json())
            .then(data => { 
                if(data.error) throw new Error(data.error)
                this.sessions = data 
            })
            .catch(err => console.error(err.message))
        },
        refreshSockets() {
            fetch('/control/sockets', { method: 'GET' })
            .then(res => res.json())
            .then(data => { 
                if(data.error) throw new Error(data.error)
                this.sockets = data 
            })
            .catch(err => console.error(err.message))
        },
        refreshUsers() {
            fetch('/control/users', { method: 'GET' })
            .then(res => res.json())
            .then(data => { 
                if(data.error) throw new Error(data.error)
                this.users = data 
            })
            .catch(err => console.error(err.message))
        },
        refreshDatabase() {
            fetch('/control/database', { method: 'GET' })
            .then(res => res.json())
            .then(data => { 
                if(data.error) throw new Error(data.error)
                this.database = data 
            })
            .catch(err => console.error(err.message))
        }        
    },
    mounted() {
        this.refreshSessions()
        this.refreshSockets()
        this.refreshUsers()
        this.refreshDatabase()
    }
}
</script>
  
<style scoped>
</style>