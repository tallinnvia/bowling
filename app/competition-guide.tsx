export default function CompetitionGuide() {
  return <section id="juhend" className="hub-guide competition-guide" aria-labelledby="guide-title">
    <h2 id="guide-title">Võistlusreeglid ja korraldaja juhend</h2>

    <details open>
      <summary>Võistluspäev samm-sammult</summary>
      <ol>
        <li><b>Ava saaliekraan.</b><p>Ava saali arvutis Chrome’is <a href="?view=display" target="_blank" rel="noreferrer">Tulemuste ekraan</a> ja vali brauseri menüüst täisekraan. Jäta see leht avatuks. Edasi juhid tablool kuvatavat oma arvutist.</p></li>
        <li><b>Avalda rajajaotus.</b><p>Ava <a href="?view=lanes">Raja info</a>, sisesta mõlema vahetuse võistkonnad ja vajuta „Avalda rajajaotus“. Vali seejärel saaliekraani nuppude hulgast „RAJA INFO“.</p></li>
        <li><b>Sisesta koosseisud ja punktid.</b><p>Ava <a href="?view=admin">Tulemuste sisestamine</a>. Vali „Lisa võistkond“, kontrolli märget „LIONS klubi“, sisesta liikmete nimed ja märgi igaühe arvestus. Mängu järel kirjuta punktid nime kõrvale.</p></li>
        <li><b>Näita tulemusi.</b><p>Vajuta „Avalda tulemused“. Vali saaliekraanile LIONSi edetabel või „Firma tulemused“. Järgmised avaldatud punktid jõuavad samale ekraanile automaatselt.</p></li>
        <li><b>Salvesta lõppseis.</b><p>Kontrolli mõlema rühma edetabeleid ja eriauhindu. Ava <a href="?view=settings">Seaded ja varukoopiad</a>, salvesta JSON-varukoopia ja ekspordi punktid CSV-failina.</p></li>
      </ol>
    </details>

    <details><summary>Rajad ja vahetused</summary>
      <table><thead><tr><th scope="col">Vahetus</th><th scope="col">Soojendus</th><th scope="col">Võistluse algus</th></tr></thead>
        <tbody><tr><th scope="row">1. vahetus</th><td>18.00–18.10</td><td>18.10</td></tr>
        <tr><th scope="row">2. vahetus</th><td>19.00–19.10</td><td>19.10</td></tr></tbody></table>
      <p>Rajajaotuses on kummalgi vahetusel oma veerg. Tühi võistkonnanimi kuvatakse saalis tähisega „Vaba“. Võistkonna ümbertõstmiseks lohista seda raja numbrist või kasuta numbril üles- ja allanooleklahvi. Järjekord muutub ainult selles vahetuses.</p>
      <p>Punane tähis „2 → 1“ näitab liikumist viimati avaldatud rajalt uuele rajale. „Avalda rajajaotus“ saadab jaotuse saali ja eemaldab muutuse tähised. Jaotuse avaldamine ning „RAJA INFO“ ekraanile valimine on eraldi tegevused.</p>
      <p>„Radade haldus“ võimaldab rada lisada, ümber nummerdada või eemaldada. Raja number peab olema kordumatu täisarv 1–99. Jaotuses saab olla kuni 64 rada. Raja eemaldamisel kustuvad selle mõlema vahetuse määrangud.</p>
    </details>

    <details><summary>Võistkonnad, liikmed ja punktide sisestamine</summary>
      <p>Uuel võistkonnal on neli liikmerida, igaühel algväärtus 0. Nimeväljal pakutakse mõlema vahetuse avaldatud rajajaotuse võistkondi. Vali pakutud nimi või kirjuta uus. Liikmed sisesta tulemuste tabelisse eraldi.</p>
      <p>„Lisa liige“ lisab tühja punktiväljaga rea. Kui mängijaid on vähem, eemalda üleliigne rida prügikasti nupust. „Eemalda võistkond“ eemaldab kinnituse järel ka selle liikmed ja punktid. Ühes võistkonnas võib olla kuni 20 liiget, võistlusel kuni 150 võistkonda.</p>
      <p>Võistkonnal ja igal lisatud liikmel peab olema nimi, kuni 100 tähemärki. Punktiväljale sobib tulemus 0–300, sealhulgas murdarv. Tühi väli tähendab sisestamata tulemust. Null läheb sisestuslehe täidetud tulemuste loendurisse, edetabelisse pääseb positiivse tulemusega.</p>
      <p>Enter liigub järgmisele nähtavale punktiväljale, Shift + Enter eelmisele. „Otsi nime“ filtreerib alates kahest tähest võistkonna või liikme nime mis tahes sõna alguse järgi. Näiteks „Tall“ leiab „LC Tallinn City“. Võistkonna vaste näitab kogu koosseisu, liikme vaste vastavaid liikmeridu. Loendurid järgivad filtrit, võistkonna summa hõlmab kogu koosseisu.</p>
      <p>Vajuta „Avalda tulemused“ või Ctrl + Enter (Macis ⌘ + Enter). Puuduv nimi või vigane punktisumma märgitakse alles avaldamiskatsel. Kursor liigub esimesele vigasele väljale ja parandamisel kaob selle veateade.</p>
    </details>

    <details><summary>Arvestusrühmad ja edetabelid</summary>
      <p><strong>„LIONS klubi“ kehtib kogu võistkonna kohta.</strong> Uuel võistkonnal on see märge valitud. „Tulemused 1“ ja „Tulemused 2“ näitavad samade LIONSi võistkondade ja nende liikmete tulemusi kahes kujunduses. „Firma tulemused“ hõlmab kõiki võistkondi, kellel märge puudub, ning nende liikmeid.</p>
      <table><thead><tr><th scope="col">Edetabel</th><th scope="col">Kohti</th><th scope="col">Kes osalevad valitud rühmas</th></tr></thead><tbody>
        <tr><th scope="row">Võistkondlik arvestus</th><td>6</td><td>Kõik positiivse summaga võistkonnad, ka naiskonnad ja juunioride võistkonnad.</td></tr>
        <tr><th scope="row">Individuaalne arvestus</th><td>6</td><td>Kõik positiivse tulemusega liikmed, ka juuniorid ja määramata arvestusega liikmed.</td></tr>
        <tr><th scope="row">Naised</th><td>3</td><td>Positiivse tulemusega liikmed, kelle valik on „Naine“.</td></tr>
        <tr><th scope="row">Mehed</th><td>3</td><td>Positiivse tulemusega liikmed, kelle valik on „Mees“.</td></tr>
        <tr><th scope="row">Naiskondlik arvestus</th><td>3</td><td>Positiivse summaga võistkonnad, mille kõik liikmed on märgitud naiseks.</td></tr>
      </tbody></table>
      <p>Liikmel saab olla üks individuaalne arvestus. Võistkonna liik tuletatakse kõigi liikmete valikust, ka siis, kui mõne liikme punktid on veel sisestamata. Kõik naised annavad naiskonna, kõik mehed meeskonna ja kõik juuniorid juunioride võistkonna. Segakoosseis või määramata valik annab üldarvestuse.</p>
      <p><strong>Võistkonna summa</strong> on kõigi sisestatud punktide summa, ümardatud kahe kümnendkohani. Näiteks 120 + 100 + 0 ja üks tühi väli annavad 220 punkti. Võistkond pääseb tabelisse ka poolelioleva koosseisu tulemusega, kui summa on üle nulli.</p>
      <p><strong>Võrdsed punktid.</strong> Edetabel järjestatakse suuremast väiksemani. Võrdsete individuaaltulemuste korral kasutatakse Exceli lähteandmetes tuvastatud mängijate algset järjestust. Need mängijad eelnevad sama punktisummaga uutele mängijatele. Muul juhul säilib andmete järjekord. Võistkondade viigi korral säilib võistkondade järjekord sisestustabelis. Tabloo nummerdab read järjest ja kuvab ka viigi korral kuni tabelis märgitud arvu kohti.</p>
    </details>

    <details><summary>Eriauhinnad ja keskmise arvutus</summary>
      <p>Tabloo alumine riba arvutatakse LIONSi ja firmade vaates kummagi rühma kohta eraldi. Arvesse lähevad kõik rühma positiivsed tulemused, sealhulgas juunioride omad ja kohad väljaspool esikuuikut.</p>
      <dl><dt>Võistkondlik tagantpoolt esimene</dt><dd>Väikseima positiivse punktisummaga võistkond.</dd>
      <dt>Individuaalne keskmisele lähim</dt><dd>Liida võistlejate positiivsed tulemused ja jaga nende arvuga. Auhinna saab võistleja, kelle punktisumma kaugus sellest keskmisest on kõige väiksem.</dd>
      <dt>Individuaalne viimane koht</dt><dd>Väikseima positiivse tulemusega võistleja.</dd></dl>
      <p><strong>Näide.</strong> Kui tulemused on 0, 80, 100, 120 ja 140, on keskmine (80 + 100 + 120 + 140) ÷ 4 = 110. Nii 100 kui ka 120 on keskmisest 10 punkti kaugusel. Mõlemad saavad eriauhinna. Ka viimase koha jagamisel kuvatakse kõik sama tulemusega saajad.</p>
    </details>

    <details><summary>Avaldamine ja saaliekraani kaugjuhtimine</summary>
      <p>„Tulemuste sisestamine“ ja „Raja info“ vahetavad korraldaja töölehte. Nende sakkide vahel liikudes säilib pooleliolev sisestus. Roheline avaldamisnupp näitab, et muudatused ootavad avaldamist. Avalda enne lehe sulgemist või uuesti laadimist.</p>
      <p>Päise paremas servas olev „Tulemuste ekraan“ avab avaliku tabloo. Selle kõrval olevad neli valikut määravad, mida publik näeb. Tumesinine valik on aktiivne. Ekraanivalik rakendub kohe ja avalikku lehte pole vaja värskendada. Rajajaotuse muutmiseks ja saaliekraani juhtimiseks sisesta korraldaja parool.</p>
      <p>Rakendus hoiab tulemusi, rajajaotust ja aktiivset ekraanivalikut serveris eraldi JSON-failidena. Saaliekraan küsib tulemusi ligikaudu iga kolme sekundi järel ning rajajaotust ja ekraanivalikut ligikaudu iga kahe ja poole sekundi järel. Teises arvutis kuvamiseks on vaja internetiühendust.</p>
      <p>Kui näed teadet „Ühendus katkenud“, kontrolli ühendust ja oota taasühendumist. Kui teine sisestaja on vahepeal sama andmestikku avaldanud, jäta oma parandused meelde või kopeeri need. Laadi teates oleva nupuga avaldatud seis, tee parandused uuesti ja avalda.</p>
    </details>

    <details><summary>Seaded, varukoopia ja uus võistlus</summary>
      <p>Seadetes saad muuta võistluse nime, korraldajat, kuupäeva ja ekraanivahetuse animatsiooni („Värvipööris“ või „Sümbolite sadu“). Kinnita valik nupuga „Salvesta seaded“.</p>
      <p>„Värskenda saaliekraani“ laadib avatud tabloo teises arvutis uuesti. Kasuta seda pärast rakenduse uuendamist. „Käsk saadetud“ tähendab, et rakendus ootab tabloolt kinnitust. „Saaliekraan värskendatud“ ilmub, kui vähemalt üks tabloo on uue lehe laadinud.</p>
      <dl><dt>Salvesta varukoopia</dt><dd>Laadib alla JSON-faili võistluse andmete, koosseisude, arvestusvalikute, punktide ja animatsiooniseadega. Rajajaotus ja aktiivne saaliekraani valik on eraldi ning jäävad varukoopiast välja.</dd>
      <dt>Taasta varukoopia</dt><dd>Vali rakenduse JSON-varukoopia ja kinnita asendamine. Kontrolli andmeid ning vajuta „Salvesta seaded“. Taastatava faili ülempiir on 300 000 baiti.</dd>
      <dt>Ekspordi tulemused</dt><dd>Laadib alla CSV-faili kõigi võistkondade liikmeridadega. Veerud on võistkond, võistleja, arvestus ja tulemus. CSV sobib Excelis avamiseks, JSON rakenduses taastamiseks.</dd>
      <dt>Alusta uut võistlust</dt><dd>Salvesta esmalt lõppseisu varukoopia. Käsk tühjendab punktid ja määrab tänase kuupäeva Tallinna aja järgi. Koosseisud ja klubimärked säilivad. Kontrolli võistluse nime ja kinnita nupuga „Salvesta seaded“. Eelmiste aastate tulemuste säilitamiseks hoia iga aasta varukoopia eraldi alles.</dd></dl>
    </details>
  </section>;
}
