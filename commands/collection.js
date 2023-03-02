const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('Base command for managing your collection'),
    async execute(interaction) {
        interaction.reply('ok');
    },
};