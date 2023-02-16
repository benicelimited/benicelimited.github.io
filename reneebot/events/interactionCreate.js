
import { Events } from 'discord.js';
import getSize from '../commands/getSize.js';
import getSku from '../commands/getSku.js';
import getType from '../commands/getType.js';

const commandList = [getSize,getSku,getType]
export default { 
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		//console.log(interaction)
		const command = commandList.filter((v,i)=> v.data.name == interaction.commandName);

		if (!command[0]) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command[0].execute(interaction);

		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};