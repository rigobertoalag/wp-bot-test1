
const fs = require('fs');
const { Client, LegacySessionAuth, LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'wp_bot_1',
    password: 'martin51',
    port: 5432,
})

const tquery = 'select now()'

const query = 'select cntr_contenedor, cntr_pedimento, cntr_fecha_ingreso, cntr_tipo, cntr_peso from containers where cntr_contenedor = $1'
const values = ['TTSSTT001122']

let resultado
pool.query(query, values, (err, res) => {
    console.log(res.rows[0])
    test(JSON.stringify(res.rows[0]))
    resultado = JSON.stringify(res.rows[0]);
    console.log('desde resultado: ', resultado)
    pool.end()
})

function test(data){
    resultado = 'Testeo:' + data
    console.log('ejecuta la funcion', resultado)
}


// Use the saved values
const client = new Client({
    authStrategy: new NoAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', message => {
    if (message.body === 'Hola') {
        let mssgToSendTT
        pool.query(tquery, (err, res) => {
            const resultadoTest = JSON.stringify(res.rows[0]);
            mssgToSendTT = resultadoTest
            pool.end()
        })
        console.log('llego el mensaje y mando los datos')
        client.sendMessage(message.from, mssgToSendTT);
    } else if (message.body) {
        const values = [message.body]
        pool.query(query, values, (err, res) => {
            const resultado = res.rows[0]
            client.sendMessage(message.from, resultado);
            pool.end()
        })
    }
    // if (message.body === '!ping') {
    //     message.reply('pong');
    //     console.log('Llego el mensaje')
    // } else if (message.body === 'Hola') {
    //     message.sendMessage('¿Como estas?');
    //     console.log('Llego el mensaje')
    // }
});

client.initialize();