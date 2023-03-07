import requests
import json
import sys
import mariadb

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
    cur.execute("SELECT * FROM prices")
    for obj in cur:
        print(obj)
    print(uuid, tcgNormal, tcgFoil, ckNormal, ckFoil)
    cur.execute("INSERT INTO prices (uuid, tcgnormal, tcgfoil, cknormal, ckfoil) VALUES (?, ?, ?, ?, ?)", (uuid, tcgNormal, tcgFoil, ckNormal, ckFoil))
    #cur.execute(f"INSERT INTO prices (uuid, tcgnormal, tcgfoil, cknormal, ckfoil) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE SET tcgnormal={tcgNormal}, tcgfoil={tcgFoil}, cknormal={ckNormal}, ckfoil={ckFoil}", (uuid, tcgNormal, tcgFoil, ckNormal, ckFoil))
    conn.close()

setPrice('00010d56-fe38-5e35-8aed-518019aa36a5', None, 8.23, None, 7.99)
sys.exit(1)
url = 'https://mtgjson.com/api/v5/AllPrices.json'
prices = requests.get(url)
allJSON = json.loads(prices.content)
pricesJSON = allJSON['data']
date = allJSON['meta']['date']

for card in pricesJSON:
    tcgRegular = None
    tcgFoil = None
    ckRegular = None
    ckFoil = None
    cardPrices = pricesJSON[card]['paper']
    tcgplayer = cardPrices['tcgplayer']['retail']
    cardkingdom = cardPrices['cardkingdom']['retail']
    if 'normal' in tcgplayer:
        tcgRegular = float(tcgplayer['normal'][date])
    if 'foil' in tcgplayer:
        tcgFoil = float(tcgplayer['foil'][date])
    if 'normal' in cardkingdom:
        ckRegular = float(cardkingdom['normal'][date])
    if 'foil' in cardkingdom:
        ckFoil = float(cardkingdom['foil'][date])
    print(f"Setting {card}")
    setPrice(card, tcgRegular, tcgFoil, ckRegular, ckFoil)