import requests
import json
import sys
import mariadb
from datetime import date
from datetime import datetime

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

def getLatestDate(priceData):
    largest = None
    for day in priceData:
        if (largest == None or (datetime.strptime(day, '%Y-%m-%d') > largest)):
            largest = datetime.strptime(day, '%Y-%m-%d')
    return datetime.strftime(largest, '%Y-%m-%d')

today = str(date.today())
logfile = open(f"logs/{today}.log", 'a')
logfile.write(f"[{str(datetime.now())}] Getting prices\n")
print(f"[{str(datetime.now())}] Getting prices")

url = 'https://mtgjson.com/api/v5/AllPrices.json'
prices = requests.get(url)
logfile.write(f"[{str(datetime.now())}] Got prices, parsing JSON\n")
print(f"[{str(datetime.now())}] Got prices, parsing JSON")
allJSON = json.loads(prices.content)

pricesJSON = allJSON['data']

logfile.write(f"[{str(datetime.now())}] JSON parsed, going through cards\n")
print(f"[{str(datetime.now())}] JSON parsed, going through cards")
for card in pricesJSON:
    tcgRegular = None
    tcgFoil = None
    ckRegular = None
    ckFoil = None
    if 'paper' not in pricesJSON[card]:
        continue
    cardPrices = pricesJSON[card]['paper']
    if 'tcgplayer' in cardPrices and 'retail' in cardPrices['tcgplayer']:
        tcgplayer = cardPrices['tcgplayer']['retail']
        if 'normal' in tcgplayer:
            priceData = tcgplayer['normal']
            priceDate = getLatestDate(priceData)
            if (priceDate == None):
                continue
            tcgRegular = float(tcgplayer['normal'][priceDate])
        if 'foil' in tcgplayer:
            priceData = tcgplayer['foil']
            priceDate = getLatestDate(priceData)
            if (priceDate == None):
                continue
            tcgFoil = float(tcgplayer['foil'][priceDate])
    if 'cardkingdom' in cardPrices and 'retail' in cardPrices['cardkingdom']:
        cardkingdom = cardPrices['cardkingdom']['retail']
        if 'normal' in cardkingdom:
            priceData = cardkingdom['normal']
            priceDate = getLatestDate(priceData)
            if (priceDate == None):
                continue
            ckRegular = float(cardkingdom['normal'][priceDate])
        if 'foil' in cardkingdom:
            priceData = cardkingdom['foil']
            priceDate = getLatestDate(priceData)
            if (priceDate == None):
                continue
            ckFoil = float(cardkingdom['foil'][priceDate])
    setPrice(card, tcgRegular, tcgFoil, ckRegular, ckFoil)

logfile.write(f"[{str(datetime.now())}] Script complete\n")
print(f"[{str(datetime.now())}] Script complete")
logfile.close()