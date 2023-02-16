import { REST, Routes } from 'discord.js';
import fs from 'node:fs'
import { readdirSync } from 'node:fs';
import { createRequire } from "module"; // Bring in the ability to create the 'require' method

import getSku from './commands/getSku.js';
import getSize from './commands/getSize.js';
import getType from './commands/getType.js';


const commands = [getSku.data,getSize.data,getType.data];
// Grab all the command files from the commands directory you created earlier
const { clientId, guildId, token } = JSON.parse(fs.readFileSync('./config.json','utf-8'));
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment


// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();