const mysql = require('mysql');
const express = require('express')
const socket = require('socket.io')
var app = require('http')
app.createServer()
app = express()
const server = app.listen(3000)

app.use(express.static('public'));

const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '747474',
    database: 'bilgagl',
    insecureAuth: true
});

dbConnection.connect((err) => {
    if (err) {
        console.error('Veritabani baglantisi basarisiz: ' + err.stack)
        return
    };
    console.log('Veritabani ile baglanti basarili')
    const selectQuery = 'SELECT * FROM messages';
    dbConnection.query(selectQuery, (err, results) => {
        if (err) {
            console.error('Mesajlar veritabanindan alinamadi ' + err.stack);
            return;
        }
        console.log('Veritabanindaki mesajlar : ');
        results.forEach((mesaj) => {
            console.log(` ${mesaj.sender}: ${mesaj.content}`);
        });
    });
});

const messages = []

const io = socket(server)
io.on('connection', (socket) => {

    console.log(socket.id);

    socket.on('chat', data => {
        io.sockets.emit('chat', data);
    });

    socket.on('typing', data => {
        socket.broadcast.emit('typing', data);
    });


    socket.on('chat', (mesaj) => {
        const { content, sender } = mesaj;
        messages.push(mesaj);

            const insertQuery = 'INSERT INTO messages SET ?';
            const values = { content: content, sender: sender };

            dbConnection.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Mesaj eklenemedi ', err.stack);
                } else {
                    console.log('Mesaj kaydi basarili');
                }
            });
    });
});

process.on('SIGINT', () => {
    dbConnection.end((err) => {
        if (err) {
            console.error('Baglanti kapatilamadi : ' + err.stack);
            return;
        }
        console.log('Veritabani bagalntisi kapandi.');
        process.exit();
    });
});

