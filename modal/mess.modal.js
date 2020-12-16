const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    content:{required: true, type:String},
    user:{required: true, type:String},
    roomName: {required: true, type: String}
})
// Biên dịch mô hình từ schema
module.exports = mongoose.model('listmess', userSchema)