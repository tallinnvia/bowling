# Tallinn VIA bowling

Avalik tabloo ja korraldaja töövaated. GitHub Pages teenindab kausta `docs`. Võistlusandmed ja parooli kontroll töötavad olemasolevas Tallinn VIA võistluse serveris. API aadress on failis `pages/index.html`.

## Avaldamine

1. Vali hoidlas **Settings → Pages → Deploy from a branch → main → /docs**.
2. Kontrolli, et `https://tallinnvia.github.io/bowling/?view=display` avab tabloo ja `?view=admin` küsib korraldaja parooli.
3. Sisesta Pagesi seadetes kohandatud domeen `bowling.tallinnvia.ee`. Seejärel lisa domeeni DNS-i CNAME-kirje nimega `bowling`, mille siht on `tallinnvia.github.io.`.
4. Pärast domeeni kinnitamist ja sertifikaadi väljastamist lülita sisse **Enforce HTTPS**.

## Muudatuste tegemine

Kasuta Node.js 22 või uuemat. Käivita `npm install` ja `npm run build`. Lisa lähtekoodi ja kausta `docs` muudatused samasse commiti. Esimeseks avaldamiseks on kaust juba valmis.

## Korraldaja ligipääs

Tulemuste sisestamine, rajajaotuse muutmine, seaded ja saaliekraani juhtimine kasutavad ühist korraldaja parooli. Server kontrollib igat muutmispäringut. Parool ja allkirjastamisvõti on serveri salajastes keskkonnamuutujates. Sisselogimine kehtib samal brauserikaardil kuni 12 tundi. Külaline saab lugeda avaldatud tulemusi ja radu.

Võistluse seisu hoiab server JSON-failidena. Punkte ja parooli GitHubisse ei laadita. Exceli ajalooliste arvestusreeglite andmed laaditakse API-st. Server lubab päringuid nii Tallinn VIA GitHub Pagesi aadressilt kui ka klubi alamdomeenilt.
