import { SlashCommandBuilder} from 'discord.js'
import { getBySize } from '../database/mysqlConnect.js';

export default {
	data: new SlashCommandBuilder()
		.setName('bysize')
		.setDescription('Replies with Products by Size')
		.addIntegerOption(option =>
			option
			.setName('size')
			.setDescription('Enter shoes size')
			.setRequired(true)

		),

	async execute(interaction) {
		if(!interaction.isChatInputCommand())return;
		let reply = await getBySize(interaction.options.get('size'))
		await interaction.reply({content: reply});
	},
};