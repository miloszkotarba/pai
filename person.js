const mongoose = require('mongoose')

const task = require('./task')
const project = require('./project')

const schema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true, transform: v => v.toISOString().slice(0, 10) },
    education: { type: Number, required: false, enum: [0, 1, 2], default: 0 },
    projects: { type: [mongoose.ObjectId], required: false, default: [] },
}, {
    versionKey: false,
    additionalProperties: false
})

let model = null

module.exports = mongoose.model('Person', schema);

module.exports = {

    getSchema: () => schema,
    getModel: () => model,

    init: connection => {
        model = connection.model('Person', schema)
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
                { $sort: { lastName: 1, firstName: 1 } },
                {
                    $match: {
                        $or: [
                            { firstName: { $regex: new RegExp(req.query.search, 'i') } },
                            { lastName: { $regex: new RegExp(req.query.search, 'i') } }
                        ]
                    }
                }
            ]
            if (req.query.education) {
                try {
                    const education = JSON.parse(req.query.education)
                    if (Array.isArray(education)) {
                        aggregation.push({ $match: { education: { $in: education } } })
                    } else {
                        throw new Error('education should be array')
                    }
                } catch (err) {
                    res.status(408).json({ error: err.message })
                    return
                }
            }
            if (req.query.minProjects) {
                let minProjects = parseInt(req.query.minProjects)
                if (minProjects >= 1) {
                    aggregation.push(...[
                        { $match: { projects: { $exists: true } } },
                        { $set: { projectsCount: { $size: "$projects" } } },
                        { $match: { projectsCount: { $gte: minProjects } } }
                    ])
                }
            }
            aggregation.push(...[
                { $skip: parseInt(req.query.skip) || 0 },
                { $limit: parseInt(req.query.limit) || 10 },
                {
                    $lookup: {
                        from: 'projects',
                        pipeline: [{ $sort: { name: 1 } }],
                        localField: 'projects',
                        foreignField: '_id',
                        as: 'projects'
                    }
                }
            ])
            model.aggregate(aggregation)
                .then(data => {
                    res.json(data)
                })
                .catch(err => {
                    res.status(408).json({ error: err.message })
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
        const _id = req.query._id;
        let updatedPerson;

        // Pobierz projekty, w których osoba była managerem przed aktualizacją
        let projectsToUpdate;
        project.getModel().find({ manager: _id })
            .then(projects => {
                projectsToUpdate = projects.map(project => project._id);
                // Aktualizuj person
                return model.findOneAndUpdate({ _id }, req.body, { new: true, runValidators: true });
            })
            .then(person => {
                if (!person) {
                    return res.status(404).json({ error: 'No such object' });
                }
                updatedPerson = person;

                // Usuń osobę z tablicy members w obiektach Task
                return task.getModel().updateMany({ "members": _id }, { $pull: { members: _id } });
            })
            .then(() => {
                // Jeśli projekt został zmieniony, usuń osobę z tablicy members w obiektach Task
                if (req.body.projects && req.body.projects.length > 0) {
                    return task.getModel().updateMany({ project: { $nin: req.body.projects }, "members": _id }, { $pull: { members: _id } });
                } else {
                    return Promise.resolve();  // Brak zmiany projektu
                }
            })
            .then(() => {
                // Zwróć zaktualizowaną osobę
                res.json(updatedPerson);
            })
            .catch(err => {
                res.status(406).json({ error: err.message });
            });
    },


    delete: (req, res) => {
        const _id = req.query._id
        let promises = [
            model.findOneAndDelete({ _id }),
            task.getModel().updateMany({}, { $pull: { members: _id } }),
            project.getModel().updateMany({ manager: _id }, { $set: { manager: null } }),
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