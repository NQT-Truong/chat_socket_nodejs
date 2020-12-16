const express = require("express");
const Mongoose = require("mongoose");
const app = express();
const server = require('http').createServer(app);
const port = 3333 ;
const io = require('socket.io')(server);
const Mess = require("./modal/mess.modal");



require('dotenv').config()
const BodyParser = require("body-parser");
const cors = require("cors");

const corsOption = {
    origin : "http://localhost:3333",
    optionsSuccessStatus: 200
}

app.use(cors());

const routes = require('./routes/index');

const listCli = [];


// function
const pustList = (name, id) => {
    let index = -1;
    let isPush = false;
    listCli.map((data,ind) => {
        if (data.name === name){
            index = ind;
        }
        if (ind === listCli.length - 1){
            isPush = true;
        }
    })
    if(index === -1 && isPush){
        listCli.push({
            name: name,
            id: id
        });
        isPush = false;
    }
};

//_________________________________________________//

// socket
io.on('connection', (socket) => {
    console.log("da ket noi",socket.id)

    socket.on("Sign", (name) => {
        if (listCli.length === 0) {
            listCli.push({
                name: name,
                id: socket.id
            });
        }else {
            pustList(name, socket.id)
        }
        io.sockets.emit("list_online", listCli);
    })

    socket.on("mess_from_client", (dt)=>{
        console.log("message_from_client", dt);
        // Them data vao database
        const newMess = new Mess();
        newMess.content = dt.data
        newMess.user = dt.id
        newMess.roomName = socket.Phong

        newMess.save();

        io.sockets.in(socket.Phong).emit("mess_from_server",dt)
    })

    socket.on("logout",(name) => {
        listCli.map((data,ind) => {
            if (data.name === name){
                listCli.splice(ind, 1);
            }
        })
        socket.broadcast.emit("list_online", listCli);
    })

    socket.on("create_room", (dt) => {
        console.log(dt)
        socket.join(dt["roomName"]);
        socket.Phong = dt["roomName"];
        socket.emit("code_room",dt["roomName"]);
        const listRoom = [];

        console.log(io.sockets.adapter.rooms)

        // io.sockets.adapter.rooms.get(dt?.roomName).forEach((t)=>{
        //     listRoom.push(t);
        // })
        listRoom.push(dt.username)
        console.log(listRoom)

        // console.log(io.sockets.adapter.rooms)
        io.sockets.emit("users_room", listRoom);
    })

    socket.on("leave_room",(dt) => {
        socket.leave(dt);
        socket.Phong = "";
        const listRoom = [];
        // console.log(io.sockets.adapter.rooms.get(dt))
        // console.log(io.sockets.adapter.rooms)

        // io.sockets.adapter.rooms.get(dt)?.forEach((t)=>{
        //     listRoom.push(t);
        // })

        io.sockets.emit("users_room", listRoom);
    })

    socket.on("disconnect", () => {
        listCli.map((data,ind) => {
            if (data.id === socket.id){
                listCli.splice(ind,1);
            }
        })
        socket.broadcast.emit("list_online", listCli);
    })
});

//_____________________________________________________//

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));


// Route middlewares
app.use('/api/user', cors(corsOption), routes);

// Kết nối database
Mongoose.connect("mongodb+srv://quangtruong:1999@cluster0.rylss.mongodb.net/chat-app?retryWrites=true&w=majority",
    {useNewUrlParser: true, useUnifiedTopology: true}).then(function() {
    console.log("Successfully connected to the database");
}).catch(function(err) {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

// Lắng nghe các requests
server.listen(port, function(){
    console.log("Server listening port",port)
})
