const { 
    SlashCommandBuilder,
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
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('Base command for managing your collection')
        .addSubcommand(subcommand =>
            subcommand
                .setName('init')
                .setDescription('Creates a new collection table')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes your collection permanently')
        ),
    async execute(interaction) {
        const subcommand = interaction.options._subcommand;
        const user = interaction.user;
        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'init') {
            let tableExists = await hasTable(user.id);
            if (tableExists) {
                interaction.editReply('You already have an existing collection');
            } else {
                createTable(user.id).then(() => {
                    interaction.editReply('Your collection has been created');
                }).catch((err) => {
                    interaction.editReply('An error occurred creating your collection');
                    console.err(err);
                })
            }
        } else if (subcommand === 'delete') {
            let tableExists = await hasTable(user.id);
            if (!tableExists) {
                interaction.editReply('You do not have a collection to delete');
            } else {
                const embed = createDeleteEmbed();
                const buttons = createConfirmationButtons(user.id);
                interaction.editReply({ embeds: [embed], components: [buttons] });

                setTimeout(() => {
                    interaction.fetchReply().then((reply) => {
                        if (reply.embeds[0].data.title === 'Are you sure?') {
                            const newEmbed = createTimeoutDeleteEmbed();
                            const newButtons = createDisabledConfirmationButtons(user.id);
                            interaction.editReply({ embeds: [newEmbed], components: [newButtons] });
                        }
                    });
                }, 15000);
            }
        }
    },
};

async function hasTable(userId) {
    let conn;
    let exists;
    try {
        conn = await pool.getConnection();
        const tables = await conn.query(`SHOW TABLES LIKE 'u${userId}'`);

        if (tables.length === 0) {
            exists = false;
        } else {
            exists = true;
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.end();
            return exists;
        }
    }
}

async function createTable(userId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const newTable = await conn.query(
            `CREATE TABLE IF NOT EXISTS u${userId} (
                card_name VARCHAR(200) NOT NULL,
                card_set VARCHAR(10) NOT NULL,
                foil BOOLEAN NOT NULL,
                count SMALLINT NOT NULL,
                location VARCHAR(100),
                price VARCHAR(10),
                colors SET('W', 'U', 'B', 'R', 'G', 'C') NOT NULL,
                rarity CHAR(1) NOT NULL,
                id VARCHAR(128) NOT NULL
              )`
        );
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

function createConfirmationButtons(userId) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm${userId}`)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`cancel${userId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );
    return row;
}

function createDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Are you sure?')
        .setDescription('Are you sure you want to delete your collection? This is permanent and cannot be undone.');
    return embed;
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

function createTimeoutDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Deletion timed out')
        .setDescription('Collection deletion has timed out');
    return embed;
}