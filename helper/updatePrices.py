import requests
import json
import sys
import mariadb
from datetime import date

with open('config.json', 'r') as config:
    configData = json.load(config)

def setPrice(uuid, tcgNormal, tcgFoil, ckNormal, ckFoil):
    try:
        conn = mariadb.connect(
            user=configData['dbUser'],
            password=configData['dbPassword'],
            host=configData['dbHost'],
            port=configData['dbPort'],
            database=configData['dbDatabase']
        )
    except mariadb.Error as e:
        print(f"Error connecting to MariaDB Platform: {e}")
        sys.exit(1)

    # Get Cursor
    cur = conn.cursor()
    cur.execute(f"INSERT INTO prices (uuid, tcgnormal, tcgfoil, cknormal, ckfoil) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tcgnormal=?, tcgfoil=?, cknormal=?, ckfoil=?",
     (uuid, tcgNormal, tcgFoil, ckNormal, ckFoil, tcgNormal, tcgFoil, ckNormal, ckFoil))
    conn.commit()
    conn.close()

today = str(date.today())
logfile = open(f"logs/{today}.log", 'a')
logfile.write("Getting prices")

url = 'https://mtgjson.com/api/v5/AllPrices.json'
prices = requests.get(url)
logfile.write("Got prices, parsing JSON")
allJSON = json.loads(prices.content)

pricesJSON = allJSON['data']
priceDate = allJSON['meta']['date']

logfile.write("JSON parsed, going through cards")
for card in pricesJSON:
    tcgRegular = None
    tcgFoil = None
    ckRegular = None
    ckFoil = None
    cardPrices = pricesJSON[card]['paper']
    tcgplayer = cardPrices['tcgplayer']['retail']
    cardkingdom = cardPrices['cardkingdom']['retail']
    if 'normal' in tcgplayer:
        tcgRegular = float(tcgplayer['normal'][priceDate])
    if 'foil' in tcgplayer:
        tcgFoil = float(tcgplayer['foil'][priceDate])
    if 'normal' in cardkingdom:
        ckRegular = float(cardkingdom['normal'][priceDate])
    if 'foil' in cardkingdom:
        ckFoil = float(cardkingdom['foil'][priceDate])
    setPrice(card, tcgRegular, tcgFoil, ckRegular, ckFoil)

logfile.write("Script complete")
logfile.close()