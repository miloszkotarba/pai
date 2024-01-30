// embedded modules
const fs = require('fs')

// external modules
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')
const expressSession = require('express-session')
const passport = require('passport')
const passportJson = require('passport-json')
const expressWs = require('express-ws')

// own modules
const auth = require('./auth')
const control = require('./control')
const websocket = require('./websocket')
const chat = require('./chat')
const person = require('./person')
const project = require('./project')
const task = require('./task')

let config = {}
try {
    config = JSON.parse(fs.readFileSync('config.json'))
} catch (err) {
    console.error('Configuration broken:', err.message)
    process.exit(0)
}

const app = express()

app.use(morgan('tiny'))
app.use(cors())

app.use(bodyParser.json())
app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message })
})

// authorization middleware
app.use(expressSession({ secret: config.dbUrl, resave: false, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new passportJson.Strategy(auth.checkCredentials))
passport.serializeUser(auth.serialize)
passport.deserializeUser(auth.deserialize)

// static content
app.use(express.static(config.frontend))

// websockets handling
const wsInstance = expressWs(app)
app.ws('/websocket', websocket(wsInstance))

// authentication endpoints
app.get('/auth', auth.whoami)
app.post('/auth', passport.authenticate('json', { failWithError: true }), auth.login, auth.errorHandler)
app.delete('/auth', auth.logout)

/*app.get('/person', auth.checkIfInRole([0, 1]), person.get)*/
app.get('/person', person.get)

app.post('/person', auth.checkIfInRole([0]), person.post)
app.put('/person', auth.checkIfInRole([0]), person.put)
app.delete('/person', auth.checkIfInRole([0]), person.delete)

app.get('/project', project.get) // public
app.get('/project/members', project.getProjectMembers)
app.post('/project', auth.checkIfInRole([0]), project.post)
app.put('/project', auth.checkIfInRole([0]), project.put)
app.delete('/project', auth.checkIfInRole([0]), project.delete)

app.get('/task', auth.checkIfInRole([0, 1]), task.get)
app.post('/task', auth.checkIfInRole([1]), task.post)
app.put('/task', auth.checkIfInRole([1]), task.put)
app.delete('/task', auth.checkIfInRole([1]), task.delete)
// @TODO auth

app.get('/listUsers', auth.checkIfInRole([0, 1]), chat.listUsers(wsInstance))

mongoose.connect(config.dbUrl).then(connection => {
    console.log('Database connected')

    // control endpoint
    app.get('/control/:what', auth.checkIfInRole([0]), control.get(wsInstance, connection))

    // initialization of the models
    person.init(connection)
    project.init(connection)
    task.init(connection)

    app.listen(config.port, () => {
        console.log('Backend listening on port', config.port)
    })
}).catch((err) => {
    console.error('Connection to database failed', err.message)
})
