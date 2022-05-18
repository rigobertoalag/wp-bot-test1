const qrcode = require('qrcode-terminal')
const axios = require('axios')

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')

const client = new Client({
    authStrategy: new LocalAuth()
})

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
    console.log('Client is ready')

    notifyNewClient = async () => {
        // Realizamos la consulta a la tabla temporal en busca de nuevas altas de clientes
        const clnt = await axios('http://localhost:8000/api/clients-temp/')
            .then(res => res.data)

        // Si existe algun campo en la tabla temporal significa que no se ha notificado al cliente de su alta
        if (clnt.clients[0]) {
            // Tomamos el ID del cliente y de su registro temporal
            const idToDelete = clnt.clients[0].new_clnt_id

            //REalizamos la busqueda del numero de celular que al cual se enviara
            const clntData = await axios('http://localhost:8000/api/clients-temp-data/' + idToDelete)
                .then(res => res.data)

            console.log('consulta el phone ' + clntData.clients[0].clnt_phone)

            //Eviamos el mensaje al numero tenia registrado
            let chatId = "521" + clntData.clients[0].clnt_phone + "@c.us"
            let msg = `*Bienvenido*\nSe ha registrado este numero de teléfono con los siguientes datos:\n\n*RFC*: ${clntData.clients[0].clnt_rfc}\n*Nombre de cliente registrado*: ${clntData.clients[0].clnt_name}\n*Dirección*: ${clntData.clients[0].clnt_address} `

            client.sendMessage(chatId, msg)
                .then(response => {
                    if (response.id.fromMe) {
                        console.log('El mensaje fue enviado')
                    }
                })

            //Eliminamos el registro de la tabla temporal
            const deleteClnt = await axios.delete('http://localhost:8000/api/clients-temp/' + idToDelete)
                .then(res => res.data)
        }
        // En caso de no ecnotrar nada en la tabla no hay clientes sin notificacion de alta
        console.log('nothig to delete')
    }

    notifyNewContainer = async () => {
        // Realizamos la consulta a la tabla temporal en busca de nuevas altas de clientes
        const cntr = await axios('http://localhost:8000/api/containers-temp/')
            .then(res => res.data)

        // Si existe algun campo en la tabla temporal significa que no se ha notificado al cliente de su alta
        if (cntr.container[0]) {
            // Tomamos el ID del contenedor y de su registro temporal
            const idToDelete = cntr.container[0].new_cntr_id

            const getClientToNotify = await axios('http://localhost:8000/api/containers-temp-data/' + idToDelete)
                .then(res => res.data)

            //Realizamos la busqueda del numero de celular que al cual se enviara
            const getPhoneNotify = await axios('http://localhost:8000/api/clients-temp-data/' + getClientToNotify.container[0].cntr_clnt_id)
                .then(res => res.data)

            //Eviamos el mensaje al numero tenia registrado
            let chatId = "521" + getPhoneNotify.clients[0].clnt_phone + "@c.us"
            let msg = `Buen día,\n\nSe ha dado de alta con exito el contenedor que solicito los datos son:\n\nContenedor: *${getClientToNotify.container[0].cntr_contenedor}*\nTipo: *${getClientToNotify.container[0].cntr_tipo}*\nTamaño: *${getClientToNotify.container[0].cntr_tamano}*\nLleno / Vacio: *${getClientToNotify.container[0].cntr_lleno_vacio}*\nPedimento: *${getClientToNotify.container[0].cntr_pedimento}*\nEstatus: *${getClientToNotify.container[0].cntr_status}*`

            client.sendMessage(chatId, msg)
                .then(response => {
                    if (response.id.fromMe) {
                        console.log('El mensaje de contenedor fue enviado')
                        // Eliminamos el registro de la tabla temporal
                        const deleteClnt = axios.delete('http://localhost:8000/api/containers-temp/' + idToDelete)
                            .then(res => res.data)
                    }
                })
        }
        // En caso de no ecnotrar nada en la tabla no hay clientes sin notificacion de alta
        console.log('nothig to delete')
    }
    const checkClient = setInterval((notifyNewClient), 10000)
    const checkContainer = setInterval((notifyNewContainer), 30000)
})

const welcomeOptions = [
    '!hola', 'buen día', 'buen', 'buenos', 'buenas', 'buena'
]
const byeOptions = [
    '!adios', 'adíos', 'gracias', 'muchas'
]

client.on('message', async message => {
    const content = message.body
    const contentDiv = content.split(" ")

    const contentOption = contentDiv[0].toLowerCase()
    const contentSearch = contentDiv[1]
    const contentDoc = contentDiv[2]

    //    if (welcomeOptions.includes('!hola')) {
    if (content === '!hola') {
        const msgToSendWelcome = `Buen día, para consultar informacion relevante solo escriba la accion y el identificador unico.\n \nEjemplo: \nContenedor YMLU5145696 \nPrevio ABJ2000002 \n\nOpciones disponibles: \nContenedor: *busca informacion del contenedor* \nPrevio: *Información sobre los previos*\nDocumento: *Se envia el documento del contenedor o previo solicitado*`

        client.sendMessage(message.from, msgToSendWelcome);
    } else if (contentOption === 'contenedor') {
        console.log('entro a la opcion contenedor', contentOption)
        console.log('contenedor del usuario', contentSearch)

        if (contentSearch) {
            const contentSearchFormat = contentSearch.toUpperCase()

            const contenedor = await axios('http://localhost:8000/api/containers/' + contentSearchFormat)
                .then(res => res.data)

            if (contenedor[0]) {
                console.log('contenedor', contenedor[0])
                const msgToSendCntr = `🚛 El contenedor es: ${contenedor[0].cntr_contenedor}\n🗺️Es de tipo: ${contenedor[0].cntr_tipo}\n📏Tamaño: ${contenedor[0].cntr_tamano}\n📝Pedimento: ${contenedor[0].cntr_pedimento}\n⬇️ Arribó el día: ${contenedor[0].cntr_fecha_arribo}`
                client.sendMessage(message.from, msgToSendCntr)
            } else {
                client.sendMessage(message.from, '❌ Lo siento no encontre información de ese contenedor\nIngresa un contenedor valido')
            }


            console.log('entro a la opcion contenedor')
        } else {
            client.sendMessage(message.from, '❌ Ingresa un valor en el contenedor para buscar\nEjemplo del formato de busqueda:\nContenedor YMLU5145696')
        }

    } else if (contentOption === 'previo') {

        if (contentSearch) {
            const contentSearchFormat = contentSearch.toUpperCase()

            const previo = await axios('http://localhost:8000/api/previos/' + contentSearchFormat)
                .then(res => res.data)

            if (previo[0]) {
                console.log('previo', previo[0])
                const msgToSendPrevio = `📑 Numero de previo: ${previo[0].prev_consecutivo}\n🧱 Cantidad: ${previo[0].prev_cantidad}\n⚖️ Peso: ${previo[0].prev_peso}\n📍 Origen: ${previo[0].prev_origen}`
                client.sendMessage(message.from, msgToSendPrevio)
            } else {
                client.sendMessage(message.from, '❌ Lo siento no encontre información de ese previo\nIngresa un previo valido')
            }
            console.log('entro a la opcion contenedor')
        } else {
            client.sendMessage(message.from, '❌ Ingresa un valor en el previo para buscar\nEjemplo del formato de busqueda:\Previo ABJ2000002')
        }
        console.log('entro a la opcion de previo')

    } else if (contentOption === 'documento') {

        if (contentSearch === 'contenedor') {
            if (contentDoc) {
                const contentDocFormat = contentDoc.toUpperCase()
                const contenedor = await axios('http://localhost:8000/api/containers/' + contentDocFormat)
                    .then(res => res.data)

                if (contenedor[0]) {
                    const cntrDoc = './pdf/contenedores/cntr-test.pdf'

                    client.sendMessage(message.from, await MessageMedia.fromFilePath(cntrDoc));
                } else {
                    client.sendMessage(message.from, '❌ Lo siento no encontre algun documento de ese contenedor\nEjemplo del formato de busqueda:\nDocumento contenedor YMLU5145696')
                }
            } else {
                client.sendMessage(message.from, '❌ Lo siento no encontre algun documento de ese contenedor\nEjemplo del formato de busqueda:\nDocumento contenedor YMLU5145696')
            }
        } else if (contentSearch === 'previo') {
            if (contentDoc) {
                const contentDocFormat = contentDoc.toUpperCase()
                const previo = await axios('http://localhost:8000/api/previos/' + contentDocFormat)
                    .then(res => res.data)

                if (previo[0]) {
                    const previoDoc = './pdf/previos/prev-test.pdf'

                    client.sendMessage(message.from, await MessageMedia.fromFilePath(previoDoc));
                } else {
                    client.sendMessage(message.from, '❌ Lo siento no encontre algun documento de ese previo\nEjemplo del formato de busqueda:\nDocumento previo ABJ2000002')
                }
            }
            else {
                client.sendMessage(message.from, '❌ Lo siento no encontre algun documento de ese previo\nEjemplo del formato de busqueda:\nDocumento previo ABJ2000002')
            }
        } else {
            client.sendMessage(message.from, '❌ Error de formato.\nEjemplo del formato de busqueda:\nDocumento contenedor YMLU5145696\nDocumento previo ABJ2000002')
        }
        console.log('entro a la opcion de documento')
        //} else if (byeOptions.includes('!adios')) {
    } else if (content === '!adios') {
        const msgToSendBye = `Gracias por utilizar nuestro servicio hasta pronto\n 👋`

        client.sendMessage(message.from, msgToSendBye);
    }
})

const apiTest = async () => {
    //constante que simula la opcion que eligio el user|
    const content = '!hola'

    //Se realiza el split de la palabra clave y el dato a buscar
    const contentDiv = content.split(" ")
    //Opcion elegida
    const contentOption = contentDiv[0].toLowerCase()
    //  //Se convierte a minusculas 
    // const contentConvert = contentDiv[0].toLowerCase()
    //Dato para buscar en la bd
    const contentSearch = contentDiv[1]

    // const msgToSendPrev = `El consecutivo es: ${}`

    console.log(contentOption)

    if (contentOption === 'contenedor') {
        const request = await axios('http://localhost:8000/api/containers/' + contentSearch)
            .then(res => res.data)

        const msgToSendCntr = `🚛 El contenedor es: ${request[0].cntr_contenedor}\n🗺️ Es de tipo: ${request[0].cntr_tipo}\n📏Tamaño: ${request[0].cntr_tamano}\n📝Pedimento: ${request[0].cntr_pedimento}\n⬇️ Arribó el día: ${request[0].cntr_fecha_arribo}`
        console.log(msgToSendCntr)
        console.log(request)
    } else if (contentOption === 'previo') {
        const request = await axios('http://localhost:8000/api/previos/' + contentSearch)
            .then(res => res.data)

        const msgToSendCntr = `📑 Numero de previo: ${request[0].prev_consecutivo}\n🧱 Cantidad: ${request[0].prev_cantidad}\n⚖️ Peso: ${request[0].prev_peso}\n📍 Origen: ${request[0].prev_origen}`
        console.log(msgToSendCntr)
        console.log(request)
    } else if (welcomeOptions.includes(contentOption)) {
        console.log('entro al if de saludo')
    } else {
        console.log('No hay info')
    }

    notifyNewClient = async () => {
        // Realizamos la consulta a la tabla temporal en busca de nuevas altas de clientes
        const clnt = await axios('http://localhost:8000/api/clients-temp/')
            .then(res => res.data)

        // Si existe algun campo en la tabla temporal significa que no se ha notificado al cliente de su alta
        if (clnt.clients[0]) {
            // Tomamos el ID del cliente y de su registro temporal
            const idToDelete = clnt.clients[0].new_clnt_id

            //REalizamos la busqueda del numero de celular que al cual se enviara
            const clntPhone = await axios('http://localhost:8000/api/clients-temp-phone/' + idToDelete)
                .then(res => res.data)

            console.log('consulta el phone ' + clntPhone.clients[0].clnt_phone)

            //Eviamos el mensaje al numero tenia registrado
            console.log('manda mensaje al wp ' + idToDelete)


            //Eliminamos el registro de la tabla temporal
            const deleteClnt = await axios.delete('http://localhost:8000/api/clients-temp/' + idToDelete)
                .then(res => res.data)
        }
        // En caso de no ecnotrar nada en la tabla no hay clientes sin notificacion de alta
        console.log('nothig to delete')
    }

    notifyNewContainer = async () => {
        // Realizamos la consulta a la tabla temporal en busca de nuevas altas de clientes
        const cntr = await axios('http://localhost:8000/api/containers-temp/')
            .then(res => res.data)
        console.log('cntr', cntr)

        // Si existe algun campo en la tabla temporal significa que no se ha notificado al cliente de su alta
        if (cntr.container[0]) {
            // Tomamos el ID del contenedor y de su registro temporal
            const idToDelete = cntr.container[0].new_cntr_id
            console.log('idToDelete', idToDelete)

            const getClientToNotify = await axios('http://localhost:8000/api/containers-temp-data/' + idToDelete)
                .then(res => res.data)
            console.log('getClientToNotify', getClientToNotify)
            console.log('getClientToNotify transform', getClientToNotify.container[0].cntr_clnt_id)

            //Realizamos la busqueda del numero de celular que al cual se enviara
            const getPhoneNotify = await axios('http://localhost:8000/api/clients-temp-data/' + getClientToNotify.container[0].cntr_clnt_id)
                .then(res => res.data)
            console.log('getPhoneNotify', getPhoneNotify)

            console.log('consulta el phone ' + getPhoneNotify.clients[0].clnt_phone)

            //Eviamos el mensaje al numero tenia registrado
            let chatId = "521" + getPhoneNotify.clients[0].clnt_phone + "@c.us"
            //let msg = `*Bienvenido*\nSe ha registrado este numero de teléfono con los siguientes datos:\n\n*RFC*: ${clntData.clients[0].clnt_rfc}\n*Nombre de cliente registrado*: ${clntData.clients[0].clnt_name}\n*Dirección*: ${clntData.clients[0].clnt_address} `

            // client.sendMessage(chatId, msg)
            //     .then(response => {
            //         if (response.id.fromMe) {
            //             console.log('El mensaje fue enviado')
            //         }
            //     })

            // Eliminamos el registro de la tabla temporal
            const deleteClnt = await axios.delete('http://localhost:8000/api/containers-temp/' + idToDelete)
                .then(res => res.data)
        }
        // En caso de no ecnotrar nada en la tabla no hay clientes sin notificacion de alta
        console.log('nothig to delete')
    }

    // notifyNewClient()
    notifyNewContainer()

    // const checkClient = setInterval(notifyNewClient, 10000)

}

//apiTest()

client.initialize()