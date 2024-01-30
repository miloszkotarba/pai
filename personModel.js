const mongoose = require('mongoose')

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

module.exports = mongoose.model('Person', schema);