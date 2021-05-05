const express = require("express");
const Mongoose = require("mongoose");
const app = express();
const server = require('http').createServer(app);
const port = 3333;
const io = require('socket.io')(server);
const uuid = require("uuid");
const Mess = require("./modal/mess.modal");
const User = require("./modal/user.modal");
const ListUserRoom = require('./modal/listUserRoom.modal')

// MQTT config
const options = {
    clientId: "mqttjs01",
    username: "dave",
    password: "123123",
    clean: true
};
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://18.139.208.99:1883', options)
//______________________________________//

require('dotenv').config()
const BodyParser = require("body-parser");
const cors = require("cors");

const corsOption = {
    origin: "http://18.139.208.99:3333",
    optionsSuccessStatus: 200
}

app.use(cors());

const routes = require('./routes/index');

const listCli = [];


// function
const pustList = (dt, id) => {
    let index = -1;
    let isPush = false;
    listCli.map((data, ind) => {
        if (data.name === dt['username']) {
            index = ind;
        }
        if (ind === listCli.length - 1) {
            isPush = true;
        }
    })
    if (index === -1 && isPush) {
        listCli.push({
            name: dt['username'],
            id: id,
            uuid: dt['uuid']
        });
        isPush = false;
    }
};

//_________________________________________________//

// MQTT connect
client.on('connect', () => {
    console.log("connected MQTT");
})
//____________________________________________________//

// socket
io.on('connection', (socket) => {
    console.log("da ket noi", socket.id)

    // Door Security App
    socket.on("control_device", (data) => {
        client.publish("control_device", data);
    })

    //____________________________//

    // Chat App
    socket.on("Sign", (data) => {
        if (listCli.length === 0) {
            listCli.push({
                name: data['username'],
                id: socket.id,
                uuid: data['uuid']
            });
        } else {
            pustList(data, socket.id)
        }
        io.sockets.emit("list_online", listCli);
    });

    socket.on("mess_from_client", (dt) => {
        // Them data vao database
        const newMess = new Mess();
        newMess.content = dt.data
        newMess.user = dt.id
        newMess.roomName = socket.Phong

        newMess.save();

        io.sockets.in(socket.Phong).emit("mess_from_server", dt)
    });

    socket.on("change-avt", (dt) => {
        User.findOneAndUpdate(
            {uuid: dt['user']},
            {$set: {avatar: dt['avatar']}},
            {
                new: true
            }).then(() => {
            console.log("change avatar ok")
        })
            .catch(err => {
                console.log(err)
            })
    });

    socket.on("create_room", (dt) => {
        socket.join(dt["roomName"]);
        socket.Phong = dt["roomName"];
        socket.emit("code_room", dt["roomName"]);

        ListUserRoom.find(
            {
                roomName: dt["roomName"]
            }, function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    if (result.length === 0) {
                        const ListUserRoom1 = new ListUserRoom();
                        ListUserRoom1.listUser = dt['user']
                        ListUserRoom1.roomName = dt['roomName']
                        ListUserRoom1.listUsername = dt['user']['username']
                        ListUserRoom1.uuid = uuid.v4()

                        ListUserRoom1.save();
                        return
                    }
                    if (!(result[0]['listUsername']).includes(dt['user']['username'])) {
                        ListUserRoom.findOneAndUpdate(
                            {roomName: dt['roomName']},
                            {
                                $set: {
                                    listUser: [...result[0]['listUser'], dt['user']],
                                    listUsername: [...result[0]['listUsername'], dt['user']['username']]
                                }
                            },
                            {
                                new: true
                            }).then(() => {
                            console.log("created user ok")
                        })
                            .catch(err => {
                                console.log(err)
                            })
                    }
                }
            }
        )
    });

    socket.on("leave_room", (dt) => {
        socket.leave(dt);
        socket.Phong = "";
        const listRoom = [];

        io.sockets.emit("users_room", listRoom);
    });

    socket.on("logout", (name) => {
        listCli.map((data, ind) => {
            if (data.name === name) {
                listCli.splice(ind, 1);
            }
        })
        socket.broadcast.emit("list_online", listCli);
    });

    socket.on("disconnect", () => {
        listCli.map((data, ind) => {
            if (data.id === socket.id) {
                listCli.splice(ind, 1);
            }
        })
        socket.broadcast.emit("list_online", listCli);
    });
    //__________________________________//

    // Stream
    socket.on("callUser", (data) => {
        io.sockets.in(data["userToCall"]).emit('hey', {signal: data["signalData"], from: data.from});
    });

    socket.on("acceptCall", (data) => {
        io.sockets.in(data["to"]).emit('callAccepted', data.signal);
    });
});

//_____________________________________________________//

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));


// Route middlewares
app.use('/api/user', cors(corsOption), routes);

// Kết nối database
Mongoose.connect("mongodb+srv://quangtruong:1999@cluster0.rylss.mongodb.net/chat-app?retryWrites=true&w=majority",
    {useNewUrlParser: true, useUnifiedTopology: true}).then(function () {
    console.log("Successfully connected to the database");
}).catch(function (err) {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

// Lắng nghe các requests
server.listen(port, function () {
    console.log("Server listening port", port)
})
