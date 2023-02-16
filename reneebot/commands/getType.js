import { SlashCommandBuilder} from 'discord.js'
import { getByType } from '../database/mysqlConnect.js';

export default {
    
	data: new SlashCommandBuilder()
		.setName('bytype')
		.setDescription('Replies with Products by Type')
		.addStringOption(option =>
			option
			.setName('type')
			.setDescription('Enter Product Type')
			.setRequired(true)

		),

	async execute(interaction) {
		if(!interaction.isChatInputCommand())return;
		let reply = await getByType(interaction.options.get('type'))
		await interaction.reply({content:reply});
	},
};