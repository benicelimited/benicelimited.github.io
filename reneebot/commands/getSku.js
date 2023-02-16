import { SlashCommandBuilder,ActionRowBuilder,EmbedBuilder, Events} from 'discord.js'
import { getBySku } from '../database/mysqlConnect.js';

const sleep = async (t) => new Promise(res=>setTimeout(()=>res(),t))
export default {
	data: new SlashCommandBuilder()
		.setName('bysku')
		.setDescription('Replies with Products by SKU')
		.addStringOption(option=>
			option
			.setName('sku')
			.setDescription('Enter Product SKU')
			.setRequired(true)
		)
		.addIntegerOption(opt=>
			opt
			.setName('ask')
			.setDescription('Enter You Own Price to compare vs Ask')
		)
		,
	
		

	
	async execute(interaction) {
		let val = interaction.options.get('sku')
		let _ask= interaction.options.get('ask')

		console.log(_ask)
		let reply
		if(_ask){
			reply = await getBySku(val.value.toLowerCase(),_ask.value)
		}else{
			reply = await getBySku(val.value.toLowerCase())
		}
		if(reply != null){
			let feilds = reply.sizes.map((v,i) =>{
				return {name:`size: ${v.size}`, value:`current_stock: ${v.qty} current_ask: ${v.price}` ,inline:true}
			})
			console.log(feilds)
			let emb = new EmbedBuilder()
				.setTitle(reply.name)
				.setDescription('Inventory Details')
				.addFields(...feilds)

			await interaction.reply({embeds:[emb]})
		}else{
			await interaction.reply({content:'Sku Not In Database'})
		}
	}
	
};