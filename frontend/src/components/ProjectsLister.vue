<template>
    <v-card>
      <v-card-title>Projects</v-card-title>
      <v-card-subtitle>
        Filtering
        <v-row>
          <v-col>
            <v-text-field v-model="search" @input="retrieve" variant="solo" label="Match name"></v-text-field>
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
                Name
              </th>
              <th class="text-left">
                Shortcut
              </th>
              <th class="text-left">
                Start date
              </th>
              <th class="text-left">
                Members
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(project, index) in projects" :key="index" @click="click(project)">
              <td>{{ project.name }}</td>
              <td><v-chip :color="project.color">{{ project.shortcut }}</v-chip></td>
              <td>{{ new Date(project.startDate).toLocaleDateString() }}</td>
              <td>{{ project.members }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editor" width="50%">
      <ProjectEditor :id="id" @dataChanged="retrieve" @cancel="cancel" @dataAccessFailed="onDataAccessFailed"/>
    </v-dialog>

    <v-snackbar v-model="dataAccessError" color="error" timeout="3000">{{ dataAccessErrorMsg }}</v-snackbar>

</template>

<script>
import common from '../mixins/common'

import ProjectEditor from './ProjectEditor.vue'

export default {
  name: 'ProjectsLister',
  components: { ProjectEditor },
  mixins: [ common ],
  props: [ 'user', 'websocket', 'eventSet' ],
  methods: {
    retrieve() {
      this.id = null
      this.editor = false
      fetch('/project?search=' + this.search + '&limit=' + this.limit, { method: 'GET' })
      .then(res => res.json())
      .then(data => { 
        if(data.error) throw new Error(data.error)
        this.projects = data 
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
      projects: [],
      id: null,
      limit: 10,
      search: '',
      dataAccessError: false,
      dataAccessErrorMsg: ''
    }
  },
  mounted() {
    this.retrieve()
  } 
}
</script>