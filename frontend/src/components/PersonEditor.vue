<template>
  <div>
    <v-card>
      <v-card-title>{{ id ? 'Edit' : 'Create' }} person</v-card-title>
      <v-card-text>
        <v-form v-model="isPersonValid">
          <v-text-field variant="solo" label="First name" v-model="person.firstName" :rules="[ rules.required ]"></v-text-field>
          <v-text-field variant="solo" label="Last name" v-model="person.lastName" :rules="[ rules.required ]"></v-text-field>
          <v-text-field variant="solo" type="date" label="Birth date" v-model="person.birthDate" :rules="[ rules.validBirthDate ]"></v-text-field>
          <v-chip-group v-model="person.education">
            <v-chip value="0">primary</v-chip>
            <v-chip value="1">secondary</v-chip>
            <v-chip value="2">high</v-chip>
          </v-chip-group>
          <v-select v-model="person.projects" label="Projects" multiple chips
              :items="projects.map(project => ({ value: project._id, title: project.name }))"
          ></v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="elevated" color="success" @click="add" :disabled="!isPersonValid" v-if="!id">Add</v-btn>
        <v-btn variant="elevated" color="success" @click="modify" :disabled="!isPersonValid" v-if="id">Modify</v-btn>
        <v-btn variant="elevated" color="error" @click="remove" v-if="id">Remove</v-btn>
        <v-btn variant="elevated" color="warning" @click="cancel">Cancel</v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="confirmation" width="auto">
      <ConfirmationDialog :question="'Are you sure to delete \'' + person.firstName + ' ' + person.lastName + '\' ?'" @ok="removeReal" @cancel="confirmation = false"/>
    </v-dialog>
  </div>
</template>

<script>
import ConfirmationDialog from './ConfirmationDialog.vue'

export default {
  name: 'PersonEditor',
  props: [ 'id' ],
  components: { ConfirmationDialog },
  emits: [ 'cancel', 'dataChanged', 'dataAccessFailed' ],
  methods: {
    add() {
      fetch('/person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.person) })
        .then(res => res.json())
        .then(data => {
          if(data.error) throw new Error(data.error)
          this.$emit('dataChanged')
        })
        .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    modify() {
      fetch('/person?_id=' + this.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.person) })
        .then(res => res.json())
        .then(data => {
          if(data.error) throw new Error(data.error)
          this.$emit('dataChanged')
        })
        .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    remove() {
      this.confirmation = true
    },
    removeReal() {
      this.confirmation = false
      fetch('/person?_id=' + this.id, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if(data.error) throw new Error(data.error)
        this.$emit('dataChanged')
      })
      .catch(err => this.$emit('dataAccessFailed', err.message))
    },
    cancel() {
      this.$emit('cancel')
    }
  },
  data() {
    return {
      isPersonValid: false,
      rules: {
        required: value => !!value || 'empty value is not allowed',
        validBirthDate: value => !isNaN(new Date(value)) || 'valid date required'
      },
      person: {},
      dialog: false,
      confirmation: false,
      projects: []     
    }
  },
  mounted() {
    fetch('/project', { method: 'GET' })
    .then(res => res.json())
    .then(data => this.projects = data)
    .catch(err => {
      this.$emit('dataAccessFailed', err.message)
      return
    })
    if(this.id) {
      fetch('/person?_id=' + this.id, { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        if(data.error) throw new Error(data.error)
        Object.assign(this.person, data)
      })
      .catch(err => this.$emit('dataAccessFailed', err.message))
    } else {
      this.person = {}
    }
  } 
}
</script>