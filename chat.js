module.exports = {

    listUsers: (wsInstance) => (req, res) => {
        req.sessionStore.all((err, sessions) => {
            if(err) {
                res.status(400).json({ error: err.message })
                return
            }
            let users = []
            wsInstance.getWss().clients.forEach(client => {
                if(!client.sessionID 
                    || !sessions[client.sessionID] 
                    || !sessions[client.sessionID].passport 
                    || !sessions[client.sessionID].passport.user) return
                let user = sessions[client.sessionID].passport.user
                if(!users.includes(user)) users.push(user)
            })
            res.send(JSON.stringify(users.sort()))                
        })
    }

}