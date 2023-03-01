const {
    Client,
    GatewayIntentBits
} = require('discord.js');

const {
    discordToken
} = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(discordToken);