const qrcode = require('qrcode-terminal')
const axios = require('axios')

const { Client, LocalAuth } = require('whatsapp-web.js')
const client = new Client({
    authStrategy: new LocalAuth()
})

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
    console.log('Client is ready')
})

client.on('message', async message => {
    const content = message.body
    const contentDiv = content.split(" ")

    const contentOption = contentDiv[0].toLowerCase()
    const contentSearch = contentDiv[1]

    const welcomeOptions = [
        'hola', 'buen día', 'buen dia','buenos días', 'buenas tardes','buena tarde'
    ]

    if (contentOption === welcomeOptions) {
       const msgToSendWelcome = `Buen día, para consultar informacion necesaria solo escribre el nombre del dato que deseas y su identificador \n Ejemplo: \n Contenedor *YMLU5145696* \n Opciones disponibles: \nContenedor *busca informacion del contenedor* \nPrevio *Datos sobre los previos*`

        client.sendMessage(message.from, msgToSendWelcome);
    } else if (contentOption === 'contenedor') {

        const contenedor = await axios('http://localhost:8000/api/containers/2')
            .then(res => res.data)

        const msgToSend = `🚛 El contenedor es: ${contenedor.cntr_contenedor}\n🗺️Es de tipo: ${contenedor.cntr_tipo}\n📏Tamaño: ${contenedor.cntr_tamano}\n📝Pedimento: ${contenedor.cntr_pedimento}\n⬇️ Arribó el día: ${contenedor.cntr_fecha_arribo}`


        client.sendMessage(message.from, msgToSend)
        console.log('entro a la opcion contenedor')
    } else if (contentOption === 'previo') {
        const request = await axios('http://localhost:8000/api/previos/' + contentSearch)
            .then(res => res.data)

        const msgToSendCntr = `📑 Numero de previo: ${request[0].prev_consecutivo}\n🧱 Cantidad: ${request[0].prev_cantidad}\n⚖️ Peso: ${request[0].prev_peso}\n📍 Origen: ${request[0].prev_origen}`
        client.sendMessage(message.from, msgToSendCntr)
        console.log('entro a la opcion de previo')
    }
})

const apiTest = async () => {
    //constante que simula la opcion que eligio el user|
    const content = 'previo ABJ2000002'

    //Se realiza el split de la palabra clave y el dato a buscar
    const contentDiv = content.split(" ")
    //Opcion elegida
    const contentOption = contentDiv[0].toLowerCase()
    //  //Se convierte a minusculas 
    // const contentConvert = contentDiv[0].toLowerCase()
    //Dato para buscar en la bd
    const contentSearch = contentDiv[1]

    console.log(contentSearch)

    // const msgToSendPrev = `El consecutivo es: ${}`

    if (contentOption === 'contenedor') {
        const request = await axios('http://localhost:8000/api/containers/' + contentSearch)
            .then(res => res.data)

        const msgToSendCntr = `🚛 El contenedor es: ${request[0].cntr_contenedor}\n🗺️ Es de tipo: ${request[0].cntr_tipo}\n📏Tamaño: ${request[0].cntr_tamano}\n📝Pedimento: ${request[0].cntr_pedimento}\n⬇️ Arribó el día: ${request[0].cntr_fecha_arribo}`
        console.log(msgToSendCntr)
    } else if (contentOption === 'previo') {
        const request = await axios('http://localhost:8000/api/previos/' + contentSearch)
            .then(res => res.data)

        const msgToSendCntr = `📑 Numero de previo: ${request[0].prev_consecutivo}\n🧱 Cantidad: ${request[0].prev_cantidad}\n⚖️ Peso: ${request[0].prev_peso}\n📍 Origen: ${request[0].prev_origen}`
        console.log(msgToSendCntr)
        console.log(request)
    } else {
        console.log('No hay info')
    }

}

apiTest()

client.initialize()