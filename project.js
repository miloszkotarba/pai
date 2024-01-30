const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    shortcut: { type: String, required: true },
    color: { type: String, required: false },
    startDate: { type: Date, required: true, transform: v => v.toISOString().slice(0, 10) },
    manager: { type: mongoose.ObjectId, default: null }
}, {
    versionKey: false,
    additionalProperties: false
})

let model = null

module.exports = {

    getSchema: () => schema,
    getModel: () => model,

    init: connection => {
        model = connection.model('Project', schema)
        return model
    },

    get: (req, res) => {
        const _id = req.query._id
        if (_id) {
            model.findOne({ _id })
                .then(data => {
                    if (data) {
                        res.json(data)
                    } else {
                        res.status(404).json({ error: 'No such object' })
                    }
                })
                .catch(err => {
                    res.status(408).json({ error: err.message })
                })
        } else {
            let aggregation = [
                { $sort: { name: 1 } },
                {
                    $match: {
                        $or: [
                            { name: { $regex: new RegExp(req.query.search, 'i') } },
                            { shortcut: { $regex: new RegExp(req.query.search) } }
                        ]
                    }
                },
                { $skip: parseInt(req.query.skip) || 0 },
                { $limit: parseInt(req.query.limit) || 1000 },
                {
                    $lookup: {
                        from: 'people',
                        localField: '_id',
                        foreignField: 'projects',
                        as: 'members'
                    }
                },
                { $set: { members: { $size: '$members' } } }
            ]
            model.aggregate(aggregation)
                .then(data => {
                    res.json(data)
                })
                .catch(err => {
                    res.status(408).json({ error: err.message })
                })
        }
    },

    getProjectMembers: (req, res) => {
        const { _id: projectID } = req.query;

        if (!projectID) {
            res.status(400).json({ error: 'projectID is required' });
        } else {
            model.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(projectID) }
                },
                {
                    $lookup: {
                        from: 'people',
                        localField: '_id',
                        foreignField: 'projects',
                        as: 'members'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        shortcut: 1,
                        color: 1,
                        startDate: 1,
                        members: { firstName: 1, lastName: 1, _id: 1 } // Dodaj pola, które chcesz zwrócić z kolekcji 'people'
                    }
                },
                {
                    $unwind: '$members'
                },
                {
                    $sort: { 'members.firstName': 1, 'members.lastName': 1 }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        shortcut: { $first: '$shortcut' },
                        color: { $first: '$color' },
                        startDate: { $first: '$startDate' },
                        members: { $push: '$members' }
                    }
                }
            ]).then(data => {
                if (data && data.length > 0) {
                    res.json(data[0]);
                } else {
                    res.json({ members: [] })
                }
            }).catch(err => {
                res.status(500).json({ error: err.message });
            });
        }
    },


    post: (req, res) => {
        const instance = new model(req.body)
        instance.save()
            .then(data => {
                res.json(data)
            })
            .catch(err => {
                res.status(406).json({ error: err.message })
            })
    },

    put: (req, res) => {
        const _id = req.query._id
        model.findOneAndUpdate({ _id }, req.body, { new: true, runValidators: true })
            .then(updated => {
                if (updated) {
                    res.json(updated)
                } else {
                    res.status(404).json({ error: 'No such object' })
                }
            })
            .catch(err => {
                res.status(406).json({ error: err.message })
            })
    },

    delete: (req, res) => {
        const person = require('./person')
        const task = require('./task')
        const _id = req.query._id
        let promises = [
            model.findOneAndDelete({ _id }),
            person.getModel().updateMany(
                { projects: { $exists: true } }, // Sprawdź, czy pole projects istnieje
                { $pull: { projects: _id } }
            ),
            task.getModel().deleteMany({ project: _id }) // Usuwa wszystkie Taski gdzie były projekty
        ]
        Promise.all(promises)
            .then(results => {
                if (results[0]) {
                    res.json(results[0])
                } else {
                    res.status(404).json({ error: 'No such object' })
                }
            }).catch(err => {
            res.status(400).json({ error: err.message })
        })
    }

}