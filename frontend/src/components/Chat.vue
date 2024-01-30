<template>
    <v-card variant="text">
        <v-card-title>Chat</v-card-title>
        <v-card-text>
            <v-list>
                <v-list-item v-for="(event, index) in posts" :key="index"
                :subtitle="event.sender + ' ' + event.timestamp.slice(11, 16)"
                :class="getItemClass(event)">
                {{ event.message }}
                </v-list-item>
            </v-list>
        </v-card-text>
        <v-card-actions>
            <v-form style="width: 100%;">
                <v-row>
                <v-col cols="4">
                <v-select v-model="recipient" label="Recipient" clearable
                  :items="activeUsers"
                ></v-select>
 
                </v-col>
                <v-col>
                <v-text-field variant="solo" label="Message" v-model="message">
                    <template #append-inner>
                        <v-btn variant="elevated" color="success" @click="send" type="submit">Send</v-btn>
                    </template>
                </v-text-field>
                </v-col>
                </v-row>
            </v-form>
        </v-card-actions>
    </v-card>
</template>
  
<script>
import { watch } from 'vue'

export default {
    name: 'ChatView',
    props: [ 'user', 'websocket', 'eventSet' ],
    data() {
        return {
            recipient: '',
            activeUsers: [],
            message: '',
            posts: []
        }
    },
    methods: {
        send() {
            let event = {
                event: 'POST',
                message: this.message
            }
            if(this.recipient) event.recipient = this.recipient
            this.websocket.send(JSON.stringify(event))    
            this.message = ''
        },
        getItemClass(event) {
            return (event.sender == this.user.username ? 'toRight' : 'toLeft') +
                ' ' + (event.recipient ? 'unicast' : 'broadcast') 
        }
    },
    mounted() {
        watch(() => this.eventSet.POST, () => {
            this.posts.push(this.eventSet.POST)
        })
        fetch('/listUsers', { method: 'GET' })
        .then(res => res.json())
        .then(data => { 
            if(data.error) throw new Error(data.error)
            this.activeUsers = data 
        })
        .catch(err => console.error(err.message))
    }
}
</script>
  
<style scoped>
.toLeft { text-align: left; }
.toRight { text-align: right; }
.unicast { color: black; }
.broadcast { color: green; }
</style>