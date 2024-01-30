<template>
  <v-card>
    <v-card-title>Tasks</v-card-title>
    <v-card-subtitle>
      Filtering
      <v-row>
        <v-col>
          <v-select
              clearable
              v-model="selectedProject"
              :items="projects.map(project => ({ value: project._id, title: project.name }))"
              label="Project"
              @update:modelValue="retrieve"
          ></v-select>
        </v-col>
        <v-col>
          <v-text-field v-model="search" @input="retrieve" variant="solo" label="Match name"></v-text-field>
        </v-col>
        <v-col cols="2">
          <div>Limit</div>
          <v-slider density="compact" v-model="limit" min="5" max="100" step="5" thumb-label
                    @update:modelValue="retrieve"></v-slider>
        </v-col>
        <v-col cols="1">
          <v-btn variant="elevated" color="success" @click="add" v-if="checkIfInRole(user, [ 1 ])">Add</v-btn>
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
            Start Date
          </th>
          <th class="text-left">
            End Date
          </th>
          <th class="text-left">
            Project
          </th>
          <th class="text-left" v-if="checkIfInRole(user, [ 1 ])">Mark Date as Done</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(task, index) in tasks" :key="index" @click="click(task)">
          <td>{{ task.name }}</td>
          <td>{{ new Date(task.startDate).toLocaleDateString() }}</td>
          <td>{{ task.endDate ? new Date(task.endDate).toLocaleDateString() : '-' }}</td>
          <td style="padding: 0.5rem 0">
            <v-chip :color="task.project.color">
              {{ task.project.shortcut }}
            </v-chip>
          </td>
          <td>
            <v-checkbox v-if="!task.endDate && checkIfInRole(user, [ 1 ])"
                        v-model="task.status"
                        color="success"
                        @click.stop="handleCheckboxClick(task, $event)"
            ></v-checkbox>
          </td>
        </tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <v-btn
            v-if="checkIfInRole(user, [ 1 ])"
            class="text-none text-white my-10"
            color="blue-darken-4"
            rounded="0"
            variant="flat"
            @click="markDateAsDone">
          Complete the End Date
        </v-btn>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>

  <v-dialog v-model="editor" width="50%">
    <TaskEditor :id="id" @dataChanged="retrieve" @cancel="cancel" @dataAccessFailed="onDataAccessFailed"/>
  </v-dialog>

  <v-snackbar v-model="dataAccessError" color="error" timeout="3000">{{ dataAccessErrorMsg }}</v-snackbar>

</template>

<script>
import common from '../mixins/common'

import TaskEditor from "@/components/TaskEditor.vue";

export default {
  name: 'TasksLister',
  components: { TaskEditor },
  mixins: [common],
  props: ['user', 'websocket', 'eventSet'],
  methods: {
    retrieve() {
      this.id = null
      this.editor = false

      if (this.selectedProject !== null) {
        fetch('/task?search=' + this.search + '&limit=' + this.limit + '&selectedProject=' + this.selectedProject, { method: 'GET' })
            .then(res => res.json())
            .then(data => {
              if (data.error) throw new Error(data.error)
              this.tasks = data
            })
            .catch(err => this.onDataAccessFailed(err.message))
        return
      }

      fetch('/task?search=' + this.search + '&limit=' + this.limit, { method: 'GET' })
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error)
            this.tasks = data
          })
          .catch(err => this.onDataAccessFailed(err.message))
    },
    add() {
      this.id = null
      this.editor = true
    },
    click(row) {
      if (!this.checkIfInRole(this.user, [1])) return
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
    },
    handleCheckboxClick(task, event) {
      // Sprawdź, czy event istnieje
      if (event && event.target) {
        // Sprawdź, czy kliknięcie pochodzi z checkboxa
        if (event.target.tagName.toLowerCase() === 'input' && event.target.type === 'checkbox') {
          event.stopPropagation(); // Zatrzymaj propagację, aby uniknąć otwierania menu
        }
      }
    },
    markDateAsDone() {
      this.tasks.forEach(task => {
        const currentDate = new Date().toISOString().split('T')[0];

        if (task.status === true && !task.endDate) {
          task.status = null;
          task.endDate = currentDate;

          // Prepare the data to be sent in the request
          const requestData = {
            endDate: task.endDate
          };

          // Send a PUT request to update the task on the server
          fetch('/task?_id=' + task._id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          })
              .then(res => res.json())
              .then(data => {
                if (data.error) throw new Error(data.error);
                this.$emit('dataChanged');
              })
              .catch(err => {
                this.$emit('dataAccessFailed', err.message);
              });
        }
      });
    }
  },
  data() {
    return {
      editor: false,
      tasks: [],
      id: null,
      limit: 10,
      search: '',
      dataAccessError: false,
      dataAccessErrorMsg: '',
      projects: [],
      selectedProject: null,
    }
  },
  mounted() {
    this.retrieve()
    fetch('/project', { method: 'GET' })
        .then(res => res.json())
        .then(data => this.projects = data)
        .catch(err => {
          this.$emit('dataAccessFailed', err.message)
          return
        })
  }
}
</script>