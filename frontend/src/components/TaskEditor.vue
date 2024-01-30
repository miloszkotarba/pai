<template>
  <div>
    <v-card>
      <v-card-title>{{ id ? 'Edit' : 'Create' }} task</v-card-title>
      <v-card-text>
        <v-form v-model="isTaskValid">
          <v-text-field variant="solo" label="Name" v-model="task.name" :rules="[ rules.required ]"></v-text-field>
          <v-text-field variant="solo" type="date" label="Start Date" v-model="task.startDate"
                        :rules="[rules.required, rules.validDate]"></v-text-field>
          <v-text-field variant="solo" type="date" label="End date" v-model="task.endDate"
                        :rules="[ rules.validDate]"></v-text-field>
          <v-select v-model="task.project" label="Projects" chips
                    :items="projects.map(project => ({ value: project._id, title: project.name }))"
          ></v-select>
          <v-select v-if="id" v-model="task.members" label="Members" chips multiple
                    :items="projectMembers.map(member => ({value: member._id, title: member.firstName + ' ' + member.lastName}))"></v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="elevated" color="success" @click="add" :disabled="!isTaskValid" v-if="!id">Add</v-btn>
        <v-btn variant="elevated" color="success" @click="modify" :disabled="!isTaskValid" v-if="id">Modify</v-btn>
        <v-btn variant="elevated" color="error" @click="remove" v-if="id">Remove</v-btn>
        <v-btn variant="elevated" color="warning" @click="cancel">Cancel</v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="confirmation" width="auto">
      <ConfirmationDialog :question="'Are you sure to delete Task: \'' + task.name + '\' ?'" @ok="removeReal"
                          @cancel="confirmation = false"/>
    </v-dialog>
  </div>
</template>

<script>
import ConfirmationDialog from './ConfirmationDialog.vue'

export default {
  name: 'TaskEditor',
  props: ['id'],
  components: { ConfirmationDialog },
  emits: ['cancel', 'dataChanged', 'dataAccessFailed'],
  methods: {
    add() {
      fetch('/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.task)
      })
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            this.$emit('dataChanged')
          })
          .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    modify() {
      if(this.task.members[0] instanceof Object) {
        this.task.members = this.task.members.map(member => member.value);
      }
      fetch('/task?_id=' + this.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.task)
      })
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            this.$emit('dataChanged')
          })
          .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    remove() {
      this.confirmation = true
    },
    removeReal() {
      this.confirmation = false
      fetch('/task?_id=' + this.id, { method: 'DELETE' })
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            this.$emit('dataChanged')
          })
          .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    cancel() {
      this.$emit('cancel')
    },
    getProjectMembers() {
      fetch('/project/members?_id=' + this.task.project, { method: 'GET' })
          .then(res => res.json())
          .then(data => {
            data.members.forEach(member => {
              this.projectMembers.push(member);
            });

            console.log(this.projectMembers)
          })
          .catch(err => this.$emit('dataAccessFailed', err.message))
    },
  },
  data() {
    return {
      isTaskValid: false,
      rules: {
        required: value => !!value || 'empty value is not allowed',
        validDate: value => !value || !isNaN(new Date(value)) || 'Valid date required'
      },
      task: {},
      dialog: false,
      confirmation: false,
      projects: [],
      projectMembers: [],
    }
  },
  mounted() {
    fetch('/project', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
              this.projects = data
            }
        )
        .catch(err => {
          this.$emit('dataAccessFailed', err.message)
          return
        })
    if (this.id) {
      fetch('/task?_id=' + this.id, { method: 'GET' })
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            Object.assign(this.task, data)

            // Przetworzenie danych członków, jeśli są w postaci obiektów
            if (Array.isArray(data.members)) {
              this.task.members = data.members.map(member => {
                return {
                  value: member._id,
                  title: member.firstName + ' ' + member.lastName
                };
              });
            }
          })
          .then(this.getProjectMembers)
          .catch(err => this.$emit('dataAccessFailed', err.message))
    } else {
      this.task = {}
    }
  }
}
</script>