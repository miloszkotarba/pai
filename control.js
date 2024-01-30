const auth = require('./auth')

module.exports = {

    get: (wsInstance, connection) => (req, res) => {
        switch(req.params.what) {
            case 'sessions':
                req.sessionStore.all((err, sessions) => {
                    if(err) {
                        res.status(400).json({ error: err.message })
                        return
                    }
                    res.json(sessions)
                })
                break
            case 'sockets':
                let sockets = []
                wsInstance.getWss().clients.forEach(client => sockets.push({ from: client._socket._peername, sessionid: client.sessionID }))
                res.send(JSON.stringify(sockets))    
                break
            case 'users':
                auth.getUsers((err, data) => {
                    if(err) {
                        res.status(400).json({ error: err.message })
                        return
                    }
                    res.json(data)
                })
                break
            case 'database':
                let database = {}
                let collections = []
                let promises = []
                for(let name of Object.keys(connection.models)) {
                    collections.push(connection.models[name].collection.name)
                    promises.push(connection.models[name].countDocuments())
                }
                Promise.all(promises)
                .then(counters => {
                    for(let i in collections) {
                        database[collections[i]] = counters[i]
                    }
                    res.json(database)
                })
                .catch(err => res.status(400).json({ error: err.message }))                
                break
            default:
                res.status(404).json({ error: 'Entity not found'})
        }
    }

}