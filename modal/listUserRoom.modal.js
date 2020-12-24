const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    listUser: {required: true, type: Array},
    listUsername: {required: true, type: Array},
    roomName: {required: true, type: String},
    uuid: {type: String},
    created: {type: Date, default: Date.now}
})
// Biên dịch mô hình từ schema
module.exports = mongoose.model('listUserRoom', userSchema)