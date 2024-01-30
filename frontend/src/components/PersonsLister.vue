<template>
    <v-card>
      <v-card-title>Persons</v-card-title>
      <v-card-subtitle>
        Filtering
        <v-row>
          <v-col>
            <v-text-field v-model="search" @input="retrieve" variant="solo" label="Match name"></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-select v-model="education" label="Education" multiple chips @update:modelValue="retrieve"
              :items="[ { value: 0, title: 'primary' }, { value: 1, title: 'secondary' }, { value: 2, title: 'high' } ]"
            ></v-select>
          </v-col>
          <v-col cols="2">
            <div>Limit</div>
            <v-slider density="compact" v-model="limit" min="5" max="100" step="5" thumb-label @update:modelValue="retrieve"></v-slider>
          </v-col>
          <v-col cols="1">
            <v-btn variant="elevated" color="success" @click="add" v-if="checkIfInRole(user, [ 0 ])">Add</v-btn>
          </v-col>
        </v-row>
      </v-card-subtitle>
      <v-card-text>
        <v-table density="compact" hover>
          <thead>
            <tr>
              <th class="text-left">
                First name
              </th>
              <th class="text-left">
                Last name
              </th>
              <th class="text-left">
                Birth date
              </th>
              <th class="text-left">
                Education
              </th>
              <th class="text-left">
                Projects
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(person, index) in persons" :key="index" @click="click(person)">
              <td>{{ person.firstName }}</td>
              <td>{{ person.lastName }}</td>
              <td>{{ new Date(person.birthDate).toLocaleDateString() }}</td>
              <td>{{ [ 'primary', 'secondary', 'high' ][person.education] }}</td>
              <td>
                <v-chip v-for="(project, pindex) in person.projects" :key="pindex" :color="project.color">
                  {{ project.shortcut }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editor" width="50%">
      <PersonEditor :id="id" @dataChanged="retrieve" @cancel="cancel" @dataAccessFailed="onDataAccessFailed"/>
    </v-dialog>

    <v-snackbar v-model="dataAccessError" color="error" timeout="3000">{{ dataAccessErrorMsg }}</v-snackbar>

</template>

<script>
import common from '../mixins/common'

import PersonEditor from './PersonEditor.vue'

export default {
  name: 'PersonsLister',
  components: { PersonEditor },
  mixins: [ common ],
  props: [ 'user', 'websocket', 'eventSet' ],
  methods: {
    retrieve() {
      this.id = null
      this.editor = false
      fetch('/person?search=' + this.search + '&education=' + JSON.stringify(this.education) + '&limit=' + this.limit, { method: 'GET' })
      .then(res => res.json())
      .then(data => { 
        if(data.error) throw new Error(data.error)
        this.persons = data 
      })
      .catch(err => this.onDataAccessFailed(err.message))
    },
    add() {
      this.id = null
      this.editor = true
    },
    click(row) {
      if(!this.checkIfInRole(this.user, [ 0 ])) return
      this.id = row._id
      this.editor = true
    },
    cancel() {
      this.id = null
      this.editor = false
    },
    onDataAccessFailed(data) {
      this.dataAccessErrorMsg = data
      this.dataAccessError = true
    }
  },
  data() {
    return {
      editor: false,
      persons: [],
      id: null,
      limit: 10,
      search: '',
      education: [ 0, 1, 2 ],
      dataAccessError: false,
      dataAccessErrorMsg: ''
    }
  },
  mounted() {
    this.retrieve()
  } 
}
</script>