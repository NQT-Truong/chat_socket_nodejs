const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    name:{required: true, type:String},
    email:{required: true, type:String},
    password:{required: true, type:String},
    uuid: {type: String}
})
// Biên dịch mô hình từ schema
module.exports = mongoose.model('user', userSchema)