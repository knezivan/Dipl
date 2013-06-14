Dipl
====

Specijalistički rad, web aplikacija razvijena u Clojure-u, sa Clojurescript-om i zasnovana na Datomic bazi podataka. 

Projekat se sastoji se iz 2 aplikacije, "diplomski" i "dipl-rest". Da bi se projekat uspješno pokrenuo, najprije je neophodno podići Datomic bazu i server, kao i updatovati sve dependendency-je (komandom lein deps u comand prompt-u, kada smo pozicionirani u folderu projekta).
Da bi se podigla Datomic baza, neophodno je, u comand prompt-u, pozicionirati se u folder u kojem smo instalirali Datomic i unijeti sledeću komandu: bin\transactor config\samples\free-transactor-template.properties 

Za podizanje lokalnog servera, iskoristili smo ring-server biblioteku, koja podržava Ring biblioteku za web aplikacije. Ring omogućava web aplikacijama da budu kreirane kao cjelina sačinjena od modularnih komponenti. 
Jetty server se podiže komandom "lein ring server" iz comand prompt-a, dok smo pozicionirani u folderu "dipl-rest". Server ce se podici na adresi "localhost:3000".

Pokretanjem fajla test.html, koji se nalazi u folderu diplomski\resources\public pokrećemo statički dio aplikacije, tj. html stranica, generisana pomoću clojurescripta u kojem biramo kriterijume na osnovu kojih će se generisati podaci u tabeli. 

U naznačeni text box, korisnik može odabrati "Procenat kompletnosti" u koji može upisati vrijednost od 0 do 1 u decimalnom obliku, zatim može selektovati check box, ukoliko u tabeli želi da vidi gubitke na brojilima očitanim daljinskim putem, i na kraju iz combo-boxa, koji se puni podacima iz baze, odabrati datum za koji želi da vidi očitavanja. 

Na osnovu odabranih kriterijuma, generisaće se tabela sa podacima koji se učitavaju iz Datomic baze podataka. Svi zahtjevi se proslijeđuju serveru, odnosto clojure fajlu koji ih tumači i na osnovu njih generiše rezultat, koji će se otvoriti u novom tabu.
