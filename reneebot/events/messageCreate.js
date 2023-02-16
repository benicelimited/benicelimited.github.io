import { Events,EmbedBuilder } from 'discord.js';
import { getBySku } from '../database/mysqlConnect.js';

let sku;
let currentValues;
export default {
    name:Events.MessageCreate,
    
    async execute(message){
        console.log(message)
        if(message.author == message.author.bot) return;
        if(message.content.startsWith("!bysku")){
            sku = message.content.split(' ')[1]
            currentValues = await getBySku(sku)
            let v = JSON.stringify(currentValues)
            console.log(currentValues)
            message.author.send(v)
            message.author.send('To compare price vs stockx ask enter value for example -10 or +10')
        }
        if(message.content.startsWith('-')){
            let decr = parseInt(message.content.split('-')[1])
            currentValues = await getBySku(sku)
            console.log(decr)
            let rply = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(currentValues.name)
                //.setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                .setDescription(currentValues.sizes.map(v=>v.price-decr))
                //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
                .setTimestamp();
                //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

            message.author.send({embed:rply,content:'To compare price vs stockx ask enter value for example -100 or +100'})
        }
        if(message.content.startsWith('+')){
            let incr = parseInt(message.content.split('+')[1])
            currentValues = await getBySku(sku)
            console.log(incr)
            let rply = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(currentValues.name)
                //.setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
                .setDescription(currentValues.sizes.map(v=>v.price+incr))
                //.setThumbnail('https://i.imgur.com/AfFp7pu.png')
                .setTimestamp();
                //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

            message.author.send({embed:rply,content:'To compare price vs stockx ask enter value for example -100 or +100'})
        }

    }
}