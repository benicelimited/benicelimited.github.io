import {Client,GatewayIntentBits,EmbedBuilder} from 'discord.js'
import fs from 'node:fs'
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import interactionCreate from './events/interactionCreate.js';
import messageCreate from './events/messageCreate.js';
import ready from './events/ready.js'
import { getBySku } from './database/mysqlConnect.js';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers] });
const { token } = JSON.parse(fs.readFileSync('./config.json','utf-8'));

const eventFiles = [ready,interactionCreate]

for (const file of eventFiles) {
	
	if (file.once) {
		client.once(file.name, (...args) => file.execute(...args));
	} else {
		client.on(file.name, (...args) => file.execute(...args));
		
	}
}

// Log in to Discord with your client's token
client.login(token);



