const { 
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const mariadb = require('mariadb');

const {
    dbAddress,
    dbPort,
    dbUser,
    dbPassword,
    dbDatabase
} = require('../config.json');

const pool = mariadb.createPool({
    host: dbAddress,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    connectionLimit: 5
});

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) {
            return;
        }

        // Collection delete button handler
        if (interaction.message.interaction.commandName === 'collection delete') {
            const buttonId = interaction.customId;
            const userId = interaction.user.id;
            if (buttonId === `confirm${userId}`) {
                dropTable(userId).then(() => {
                    const embed = createConfirmedDeleteEmbed();
                    const buttons = createDisabledConfirmationButtons(userId);
                    interaction.update({ embeds: [embed], components: [buttons] });
                }).catch((err) => {
                    const embed = createErrorDeleteEmbed();
                    const buttons = createDisabledConfirmationButtons(userId);
                    interaction.update({ embeds: [embed], components: [buttons] });
                    console.log(err);
                });
            } else if (buttonId === `cancel${userId}`) {
                const embed = createCancelledDeleteEmbed();
                const buttons = createDisabledConfirmationButtons(userId);
                interaction.update({ embeds: [embed], components: [buttons] });
            }
        }
    }
};

async function dropTable(userId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const dropTable = await conn.query(`DROP TABLE IF EXISTS u${userId}`);
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

function createDisabledConfirmationButtons(userId) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm${userId}`)
                .setLabel('Confirm')
                .setDisabled(true)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`cancel${userId}`)
                .setLabel('Cancel')
                .setDisabled(true)
                .setStyle(ButtonStyle.Danger)
        );
    return row;
}

function createCancelledDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Deletion Cancelled')
        .setDescription('Collection deletion has been cancelled.');
    return embed;
}

function createConfirmedDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Deletion Successful')
        .setDescription('Your collection has been deleted.');
    return embed;
}

function createErrorDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('An error occurred')
        .setDescription('An error occurred trying to delete your collection.');
    return embed;
}