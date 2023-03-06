const mariadb = require('mariadb');
const https = require('https');
const fs = require('fs');

const {
    dbAddress,
    dbPort,
    dbUser,
    dbPassword,
    dbDatabase
} = require('./config.json');

const pool = mariadb.createPool({
    host: dbAddress,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    connectionLimit: 5
});

downloadPrintings().then(() => {
    console.log('printings done');
});
downloadPrices().then(() => {
    fs.readFile('../data/AllPrices.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const prices = JSON.parse(data);
            prices['data'].forEach((uuid) => {
                console.log(uuid);
            });
        }
    });
});

async function dropTables() {
    let conn;
    try {
        conn = await pool.getConnection();
        const dropped = await conn.query(`
            DROP TABLE IF EXISTS cards; 
            DROP TABLE IF EXISTS foreign_data; 
            DROP TABLE IF EXISTS legalities; 
            DROP TABLE IF EXISTS meta; 
            DROP TABLE IF EXISTS rulings; 
            DROP TABLE IF EXISTS sets; 
            DROP TABLE IF EXISTS set_translations; 
            DROP TABLE IF EXISTS tokens; 
            DROP TABLE IF EXISTS prices;`);
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

async function executeQuery(content) {
    let conn;
    try {
        conn = await pool.getConnection();
        const data = await conn.query(content);
    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            return conn.end();
        }
    }
}

async function downloadPrintings() {
    await fs.promises.mkdir('../data', { recursive: true });
    const dataFile = fs.createWriteStream('../data/AllPrintings.sql');
    return new Promise((resolve) => {
        https.get('https://mtgjson.com/api/v5/AllPrintings.sql', (response) => {
            response.pipe(dataFile);

            dataFile.on('finish', () => {
                dataFile.close();
                resolve();
            });
        });
    });
}

async function downloadPrices() {
    await fs.promises.mkdir('../data', { recursive: true });
    const dataFile = fs.createWriteStream('../data/AllPrices.json');
    return new Promise((resolve) => {
        https.get('https://mtgjson.com/api/v5/AllPrices.json', (response) => {
            response.pipe(dataFile);

            dataFile.on('finish', () => {
                dataFile.close();
                resolve();
            });
        });
    });
}

function convertPrices(prices) {
    const pricesJSON = JSON.parse(prices);
    console.log(pricesJSON);
    let sql = '';

    return sql;
}
