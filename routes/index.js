const express = require('express');
const router = express.Router();
const User = require("../modal/user.modal");
const Mess = require("../modal/mess.modal");
const {registerValidation, loginValidation} = require("../auth/validation");
const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const verify = require("../auth/checkToken");
const uuid = require("uuid");

router.post('/register',
    async function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "1800");
        res.setHeader("Access-Control-Allow-Headers", "content-type");
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");
        // Validate user
        const {error} = registerValidation(req.body);
        if (error) return res.status(400).send(error.details[0].message)

        // Kiểm tra name có tồn tại hay không
        const nameExist = await User.findOne({name: req.body.name});
        if (nameExist) return res.status(400).send("Username đã tồn tại")

        // Mã hóa password
        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(req.body.password, salt)

        // Tạo user
        const newUser = new User();
        newUser.name = req.body.name
        newUser.email = req.body.email
        newUser.password = hashPass
        newUser.uuid = uuid.v4()
        newUser.avatar = ""
        try {
            const User = await newUser.save()
            res.send(User);
        } catch (err) {
            res.status(400).send(err);
        }
    });

router.post('/login',

    async function login(req, res) {

        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "1800");
        res.setHeader("Access-Control-Allow-Headers", "content-type");
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");

        // Kiểm tra email
        const userLogin = await User.findOne({name: req.body.username});
        if (!userLogin) return res.status(400).send("Username không đúng")

        // Kiểm tra password
        const passLogin = await bcrypt.compare(req.body.password, userLogin.password);
        if (!passLogin) return res.status(400).send("Mật khẩu không hợp lệ")

        //Ký và tạo token
        // const token = jwt.sign({_id: userLogin._id}, process.env.SECRET_TOKEN)
        // res.header("auth-token", token).send(token);


        res.send({
            "username": userLogin.name,
            "password": userLogin.password,
            "uuid": userLogin.uuid,
            "avatar": userLogin.avatar
        })

        // Validate user
        const {error} = loginValidation(req.body);
        if (error) return res.status(400).send(error.details[0].message)


    });

router.get('/tinnhan',
    async function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "1800");
        res.setHeader("Access-Control-Allow-Headers", "content-type");
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");

        Mess.find({}, function (err, result) {
            if (err) {
                console.log(err)
            } else {
                const data = [];

                result.forEach((dt) => {
                    if (req.query['roomName'] === dt.roomName) {
                        data.push(
                            {
                                content: dt.content,
                                user: dt.user
                            }
                        )
                    }
                })
                res.send(data);
            }
        })
    })

router.get('/list-user-room', async function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "1800");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    Mess.find({}, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            let data = [];
            result.forEach((dt) => {
                if (req.query['roomName'] === dt.roomName) {
                    if (!data.includes(dt.user)) {
                        data.push(dt.user);
                    }

                }
            })
            res.send(data);
        }
    })
})

// router.get('/test', verify, function (req, res) {
//     res.send("Chào mừng bạn đến với website của mình. Chúc bạn một ngày vui vẻ")
// })


module.exports = router