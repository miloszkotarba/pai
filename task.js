const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    startDate: { type: Date, required: true, transform: v => v.toISOString().slice(0, 10) },
    endDate: { type: Date, required: false, transform: v => (v ? v.toISOString().slice(0, 10) : null) },
    project: { type: mongoose.ObjectId, required: true, default: null },
    members: { type: [mongoose.ObjectId], required: false, default: [] },
}, {
    versionKey: false,
    additionalProperties: false
})

let model = null

module.exports = {

    getSchema: () => schema,
    getModel: () => model,

    init: connection => {
        model = connection.model('Task', schema)
        return model
    },

    get: (req, res) => {
        const _id = req.query._id
        if (_id) {
            model.findOne({ _id }).populate('members', 'firstName lastName', 'Person')
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
            let matchConditions = [];

            // Check if there is a search filter
            if (req.query.search) {
                matchConditions.push({ name: { $regex: new RegExp(req.query.search, 'i') } });
            }

            // Check if there is a selectedProject filter
            if (req.query.selectedProject) {
                matchConditions.push({ 'project._id': new mongoose.Types.ObjectId(req.query.selectedProject) });
            }

            let aggregation = [
                {
                    $lookup: {
                        from: 'projects',
                        localField: 'project',
                        foreignField: '_id',
                        as: 'project'
                    }
                },
                { $set: { project: { $arrayElemAt: ['$project', 0] } } }, //object instead of array
                { $sort: { 'project.shortcut': 1, 'project.name': 1, name: 1 } },
                {
                    $match: {
                        $and: matchConditions.length > 0 ? matchConditions : [{}]  // Jeżeli nie ma filtrów, dodaj pusty warunek
                    }
                },
                { $skip: parseInt(req.query.skip) || 0 },
                { $limit: parseInt(req.query.limit) || 1000 }
            ];

            model.aggregate(aggregation)
                .then(data => {
                    res.json(data);
                })
                .catch(err => {
                    res.status(408).json({ error: err.message });
                })
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
        const _id = req.query._id
        model.findOneAndDelete({ _id }).then(deleted => {
            if (deleted) {
                res.json(deleted)
            } else {
                res.status(404).json({ error: 'No such object' })
            }
        }).catch(err => {
            res.status(400).json({ error: err.message })
        })
    }
}