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
    dbUsername,
    dbPassword,
    userCollectionDatabase,
    dataDatabase
} = require('../config.json');

/*
const collectionPool = mariadb.createPool({
    host: dbAddress,
    port: dbPort,
    user: dbUsername,
    password: dbPassword,
    database: userCollectionDatabase,
    connectionLimit: 5
});
*/

const dataPool = mariadb.createPool({
    host: dbAddress,
    port: dbPort,
    user: dbUsername,
    password: dbPassword,
    database: dataDatabase,
    connectionLimit: 5
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('Base command for managing your collection')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('init')
                .setDescription('Creates a new collection table')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('delete')
                .setDescription('Deletes your collection permanently')
        )
        .addSubcommandGroup((group) =>
            group
                .setName('card')
                .setDescription(
                    'Manages adding and removing cards from the collection'
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('add')
                        .setDescription('Adds a card to the collection')
                        .addStringOption((option) =>
                            option
                                .setName('name')
                                .setDescription('The name of the card')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('set')
                                .setDescription('The set code of the card')
                                .setRequired(true)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('foil')
                                .setDescription(
                                    'Whether or not the card is foil (default false)'
                                )
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('token')
                                .setDescription(
                                    'Whether the card is a token (default false)'
                                )
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('count')
                                .setDescription(
                                    'How many of the card to add (default 1)'
                                )
                        )
                        .addStringOption((option) =>
                            option
                                .setName('location')
                                .setDescription(
                                    'Location the card is for organization (default none)'
                                )
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('remove')
                        .setDescription('Removes a card from the collection')
                        .addStringOption((option) =>
                            option
                                .setName('name')
                                .setDescription('The name of the card')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('set')
                                .setDescription('The set code of the card')
                                .setRequired(true)
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('foil')
                                .setDescription(
                                    'Whether or not the card is foil (default false)'
                                )
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('token')
                                .setDescription(
                                    'Whether the card is a token (default false)'
                                )
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('count')
                                .setDescription(
                                    'How many of the card to remove (default 1)'
                                )
                        )
                        .addStringOption((option) =>
                            option
                                .setName('location')
                                .setDescription(
                                    'Location the card is for organization (default none)'
                                )
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('move')
                        .setDescription(
                            'Moves a card from one location to another'
                        )
                        .addStringOption((option) =>
                            option
                                .setName('name')
                                .setDescription('The name of the card')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('set')
                                .setDescription('The set code of the card')
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('newlocation')
                                .setDescription(
                                    "New location of the card ('null' for no location)"
                                )
                                .setRequired(true)
                        )
                        .addStringOption((option) =>
                            option
                                .setName('oldlocation')
                                .setDescription(
                                    'Old location of the card (default none)'
                                )
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('foil')
                                .setDescription(
                                    'Whether or not the card is foil (default false)'
                                )
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName('token')
                                .setDescription(
                                    'Whether the card is a token (default false)'
                                )
                        )
                        .addIntegerOption((option) =>
                            option
                                .setName('count')
                                .setDescription(
                                    'How many of the card to move (default 1)'
                                )
                        )
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup();
        const user = interaction.user;
        await interaction.deferReply({ ephemeral: true });

        if (group === 'card') {
            if (subcommand === 'add') {
                addCardToCollectionDB(interaction);
            }
        }

        const tableExists = await hasCollection(user.id);
        if (group === 'card') {
            if (!tableExists) {
            }
            const cardName = interaction.options.getString('name');
            const cardSet = interaction.options.getString('set');
            const isFoil =
                interaction.options.getBoolean('foil') === true ? true : false;
            const isToken =
                interaction.options.getBoolean('token') === true ? true : false;
            const count =
                interaction.options.getInteger('count') === null
                    ? 1
                    : interaction.options.getInteger('count');

            if (subcommand === 'add' || subcommand === 'remove') {
                getCardsFromDB(cardName, cardSet, isToken)
                    .then((cards) => {
                        if (cards.length === 0) {
                        }
                        if (cards.length === 1) {
                            const card = cards[0];

                            const hasFoil = card.hasFoil;
                            const hasNonFoil = card.hasNonFoil;
                            if (isFoil && !hasFoil) {
                                interaction.editReply(
                                    'Foil card was selected, but this card does not have a foil version'
                                );
                            } else if (!isFoil && !hasNonFoil) {
                                interaction.editReply(
                                    'Non-foil card was selected, but this card only exists in foil'
                                );
                            } else {
                                if (subcommand === 'add') {
                                    addCardToCollectionDB(
                                        user.id,
                                        card.uuid,
                                        isFoil,
                                        count,
                                        location
                                    )
                                        .then(() => {
                                            interaction.editReply('Card added');
                                        })
                                        .catch((err) => {
                                            interaction.editReply(
                                                'An error occurred adding the card'
                                            );
                                            console.log(err);
                                        });
                                } else if (subcommand === 'remove') {
                                    getCardsInCollection(
                                        user.id,
                                        card.uuid,
                                        isFoil,
                                        location
                                    )
                                        .then((cards) => {
                                            if (cards.length === 0) {
                                                interaction.editReply(
                                                    'You do not have this card in your collection'
                                                );
                                            } else if (cards.length > 1) {
                                                interaction.editReply(
                                                    "Multiple copies of the same card, this shouldn't be possible"
                                                );
                                            } else {
                                                if (cards[0].count < count) {
                                                    interaction.editReply(
                                                        `You only have ${cards[0].count} of this card in your collection, cannot remove ${count}`
                                                    );
                                                } else {
                                                    removeCardFromCollection(
                                                        user.id,
                                                        card.uuid,
                                                        isFoil,
                                                        cards[0].count,
                                                        count,
                                                        location
                                                    ).then(() => {
                                                        interaction.editReply(
                                                            'Card removed'
                                                        );
                                                    });
                                                }
                                            }
                                        })
                                        .catch((err) => {
                                            interaction.editReply(
                                                'An error occurred removing this card'
                                            );
                                            console.log(err);
                                        });
                                }
                            }
                        }
                    })
                    .catch((err) => {
                        interaction.editReply(
                            'An error occurred finding that card'
                        );
                        console.log(err);
                    });
            }
        } else if (group === null) {
            if (subcommand === 'init') {
                if (tableExists) {
                    interaction.editReply(
                        'You already have an existing collection'
                    );
                } else {
                    createCollectionTable(user.id)
                        .then(() => {
                            interaction.editReply(
                                'Your collection has been created'
                            );
                        })
                        .catch((err) => {
                            interaction.editReply(
                                'An error occurred creating your collection'
                            );
                            console.log(err);
                        });
                }
            } else if (subcommand === 'delete') {
                if (!tableExists) {
                    interaction.editReply(
                        'You do not have a collection to delete'
                    );
                } else {
                    const embed = createDeleteEmbed();
                    const buttons = createConfirmationButtons(user.id);
                    interaction.editReply({
                        embeds: [embed],
                        components: [buttons]
                    });

                    setTimeout(() => {
                        interaction.fetchReply().then((reply) => {
                            if (
                                reply.embeds[0].data.title === 'Are you sure?'
                            ) {
                                const newEmbed = createTimeoutDeleteEmbed();
                                const newButtons =
                                    createDisabledConfirmationButtons(user.id);
                                interaction.editReply({
                                    embeds: [newEmbed],
                                    components: [newButtons]
                                });
                            }
                        });
                    }, 15000);
                }
            }
        }
    }
};

// Handles the '/collection card add' command
async function sr(interaction) {
    const user = interaction.user;
    const tableExists = await hasCollection(user.id);

    // Make sure the user has a collection
    if (!tableExists) {
        interaction.editReply(
            'You do not have a collection started. Run `/collection init` to start one'
        );
        return;
    }

    // Get command arguments
    const cardName = interaction.options.getString('name');
    const cardSet = interaction.options.getString('set');
    const isToken =
        interaction.options.getBoolean('token') === true ? true : false;
    const isFoil =
        interaction.options.getBoolean('foil') === true ? true : false;
    const count =
        interaction.options.getInteger('count') === null
            ? 1
            : interaction.options.getInteger('count');
    const location = interaction.options.getString('location');

    // Get a list of cards in cardSet matching cardName
    const cards = getCardsFromDB(cardName, cardSet, isToken);
    // Check if empty response
    if (cards.length === 0) {
        interaction.editReply(
            `Could not find a card with name \`${cardName}\` in set \`${cardSet}\``
        );
        return;
    }

    // Exactly 1 response, try to add it
    if (cards.length === 1) {
        const card = cards[0];
        // Name provided and name in DB don't match
        // Example: user provided "Kalitas", but the card was "Kalitas, Traitor of Ghet"
        if (card.name !== cardName) {
            interaction.editReply(
                `Could not find card with name \`${cardName}\`, but found \`${card.name}\``
            );
            return;
        }
        // Check if the card has an existing foil version if foil was selected
        if (!card.hasFoil && isFoil) {
            interaction.editReply(
                'Foil card was selected, but this card does not have a foil version'
            );
            return;
        }
        // Check if the card has a non-foil version if foil not selected
        if (!card.hasNonFoil && !isFoil) {
            interaction.editReply(
                'Non-foil card was selected, but this card only exists in foil'
            );
            return;
        }
        // Checks passed, add the card to the database
        addCardToCollectionDB(user.id, card.uuid, isFoil, count, location)
            .then(() => {
                interaction.editReply('Card added');
            })
            .catch((err) => {
                interaction.editReply('An error occured');
                console.log(err);
            });
        return;
    }

    // Multiple cards in the response, a bit complicated to handle

    // Get a list of cards with an exact match name
    const nameMatch = cards.filter((card) => card.name === cardName);
    // If there are no exact matches, just list the matches
    if (nameMatch.length === 0) {
        let nameStr;
        // Build a string list of the partial matches
        cards.forEach((card) => {
            nameStr += `\`${card.name}\`, `;
        });
        nameStr.substring(0, nameStr.length - 2);
        interaction.editReply(`No exact matches found, found ${nameStr}`);
        return;
    }

    const diffs = getDifferences(nameMatch);
    console.log(diffs);
    interaction.editReply('doot');
}

// Finds every difference in the database among a list of cards
function getDifferences(cards) {
    let diffs = [];
    for (let i = 0; i < cards.length; i++) {
        diffs[i] = {};
        for (let j = 1; j < cards.length; j++) {
            for (const key in cards.keys()) {
                if (cards[i][key] !== cards[j][key]) {
                    diffs[i][key] = cards[i][key];
                }
            }
        }
    }
    return diffs;
}

// Checks if a collection table exists for userId
async function hasCollection(userId) {
    let conn;
    let exists;
    try {
        conn = await collectionPool.getConnection();
        const tables = await conn.query(`SHOW TABLES LIKE 'u${userId}';`);

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

// Creates a collection table for userId
// Each user's collection only needs the card UUID and then data not stored in the mtgjson data
// All other information about the card will be dynamically pulled from mtgjson database
async function createCollectionTable(userId) {
    let conn;
    try {
        conn = await collectionPool.getConnection();
        const newTable = await conn.query(
            `CREATE TABLE IF NOT EXISTS u${userId} (
                uuid CHAR(36) NOT NULL,
                foil BOOLEAN NOT NULL,
                count SMALLINT NOT NULL,
                location VARCHAR(100)
              );`
        );
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

// Gets card matches from the mtgjson data
async function getCardsFromDB(cardName, setCode, token) {
    let conn;
    let card;
    try {
        conn = await dataPool.getConnection();
        if (token) {
            card = await conn.query(
                `SELECT * FROM tokens WHERE (name LIKE '%${cardName}%') AND (setCode='${setCode}');`
            );
        } else {
            card = await conn.query(
                `SELECT * FROM cards WHERE (name LIKE '%${cardName}%') AND (setCode='${setCode}');`
            );
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.end();
            return card;
        }
    }
}

// Puts count cards into userId's collection
async function addCardToCollectionDB(userId, uuid, foil, count, location) {
    let existing = await getCardsInCollection(userId, uuid, foil, location);
    if (existing.length === 1) {
        count = existing[0].count + count;
    }

    let conn;
    try {
        conn = await collectionPool.getConnection();
        if (existing.length === 1) {
            if (location === null) {
                added = await conn.query(
                    `UPDATE u${userId} SET count=${count} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location IS NULL);`
                );
            } else {
                added = await conn.query(
                    `UPDATE u${userId} SET count=${count} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location='${location}');`
                );
            }
        } else {
            added = await conn.query(
                `INSERT INTO u${userId} VALUES (?, ?, ?, ?);`,
                [uuid, foil, count, location]
            );
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

// Removes count cards from userId's collection
async function removeCardFromCollection(
    userId,
    uuid,
    foil,
    existingCount,
    count,
    location
) {
    let conn;
    try {
        conn = await collectionPool.getConnection();
        if (existingCount === count) {
            if (location === null) {
                removed = await conn.query(
                    `DELETE FROM u${userId} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location IS NULL);`
                );
            } else {
                removed = await conn.query(
                    `DELETE FROM u${userId} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location='${location});`
                );
            }
        } else {
            if (location === null) {
                added = await conn.query(
                    `UPDATE u${userId} SET count=${
                        existingCount - count
                    } WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location IS NULL);`
                );
            } else {
                added = await conn.query(
                    `UPDATE u${userId} SET count=${
                        existingCount - count
                    } WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location='${location}');`
                );
            }
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

// Gets cards in userId's collection matching params
async function getCardsInCollection(userId, uuid, foil, location) {
    let conn;
    let cards;
    try {
        conn = await collectionPool.getConnection();
        if (location === null) {
            cards = await conn.query(
                `SELECT * FROM u${userId} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location IS NULL);`
            );
        } else {
            cards = await conn.query(
                `SELECT * FROM u${userId} WHERE (uuid='${uuid}') AND (foil=${foil}) AND (location='${location}');`
            );
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.end();
            return cards;
        }
    }
}

// Creates buttons for confirm or cancel
function createConfirmationButtons(userId) {
    const row = new ActionRowBuilder().addComponents(
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

// Creates an embed with a delete confirmation message
function createDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Are you sure?')
        .setDescription(
            'Are you sure you want to delete your collection? This is permanent and cannot be undone.'
        );
    return embed;
}

// Creates disabled confirm or cancel buttons
function createDisabledConfirmationButtons(userId) {
    const row = new ActionRowBuilder().addComponents(
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

// Creates an embed for a timed out collection deletion
function createTimeoutDeleteEmbed() {
    const embed = new EmbedBuilder()
        .setTitle('Deletion timed out')
        .setDescription('Collection deletion has timed out');
    return embed;
}
