import { Client,GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMembers] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


client.on('guildMemberAdd', member => {
// Send a message to the user asking them to verify
member.send(
    'Welcome to the server! Please verify your account by typing !verify within the next 1 minute.'
);

// Set a timer to kick the user if they fail to verify
setTimeout(() => {
    // Check if the user has verified their account
    if (!member.roles.cache.find(role => role.name === 'Uninitiate')) {
    // Kick the user if they haven't verified
    member
        .kick('Failed to verify within the required timeframe.')
        .then(() => {
        console.log(`Kicked ${member.user.tag} for failing to verify.`);
        })
        .catch(error => {
        console.error(error);
        });
    }
}, 1 * 60 * 1000);
});

client.on('message', message => {
    console.log(message.content)
    if (message.content === '!verify') {
        // Check if the user is a member of the server
        if (!message.member) {
        return;
        }

        // Give the user the Verified role
        message.member
        .roles.add('Uninitiate')
        .then(() => {
            message.reply('Your account has been verified!');
        })
        .catch(error => {
            console.error(error);
        });
    }
});


client.login('MTA3MzgyNDI1ODUzMjMxOTMxNQ.GYJFnj.E8_R4nUP-kBAJsgMIJrd79ldD47Xc8cPytm46A');
