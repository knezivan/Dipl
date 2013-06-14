(ns cljs.diplomski.epcg
    (:use    [incanter.core] 
              [incanter.excel])
    (:import [datomic Peer Util] ;; Imports only used in data loading
            [java.io FileReader]
            [java.util.Date]
            [java.lang.Math])
    (:require [clojure.pprint]
              [datomic.api :exclude [filter] :as d]) )

;; URI za konekciju

(def conn-uri "datomic:free://localhost:4334/epcg_izvjestaji")

;;(def conn-uri "datomic:mem://epcg_izv")

;; kreiranje baze

;;(d/create-database conn-uri)
                     
;; konekcija na bazu

(def conn (d/connect conn-uri))

;;kreiranje seme

(defn kreiranje-seme [] (.get (.transact conn
                   (first (Util/readAll
                            (FileReader."epcg-schema.dtm"))))))

;; unos lot-a

(defn unos-svih-lot [] (.get  (.transact conn 
                                [{:db/id 1
                               :lot/naziv "Sjeverna regija" 
                               :lot/skracenica "LOT1"} 
                              {:db/id 2
                               :lot/naziv "Centralna regija" 
                               :lot/skracenica "LOT2"}
                              {:db/id 3
                               :lot/naziv "Juzna regija"
                               :lot/skracenica "LOT3"}])))

;; unos ed

(defn sve-ed [putanja] (read-xls putanja))

(defn unesi-ed [ed] (.get (.transact conn
                            [{:db/id (java.lang.Math/round (ed "SIFRA"))
                           :ed/naziv (ed "IME")
                           :ed/sifra  (str (java.lang.Math/round (ed "SIFRA")))
                           :ed/lot (java.lang.Math/round (ed "FK_LOT"))}])))

(defn unos-svih-ed [putanja]  (map unesi-ed (:rows (sve-ed putanja))))

;; provjera za integer vrijednosti

(defn provjera-integer [broj] (if (= (type broj) java.lang.Double)
                                (java.lang.Math/round broj)
                                (try (java.lang.Integer/parseInt (str broj))
                                  (catch NumberFormatException e 0))))

;; provjera za sifru tr

(defn provjera-sifre [sifra] (if (= (type sifra) java.lang.Double)
                               (str (java.lang.Math/round sifra))
                               (try (str (java.lang.Math/round (java.lang.Double/parseDouble (str sifra))))
                                 (catch NumberFormatException e sifra))))
;; dijeljenje

(defn dijeljenje [a,b] (try (if (or (= b 0.0) (= b 0))
                           0.0
                           (double (/ a b)))
                        (catch NullPointerException e 0.0) ))

;; provjera da li je celija u excel fajlu prazna

(defn provjera-prazna-celija [vrijednost] (if (or (= vrijednost nil) (= vrijednost ""))
                                            0.0 
                                            vrijednost))

;; unos tr

(defn svi-tr [putanja] (read-xls putanja))

(defn new-user-id [] (d/tempid :db.part/user))

(defn procitaj-tr [tr] {:db/id (new-user-id)
                              :tr/naziv (if (= (type (tr "NAZIV")) java.lang.Double)
                                          (str (java.lang.Math/round (tr "NAZIV")))
                                          (str (tr "NAZIV")))    
                              :tr/sifra (if (= (type (tr "SIFRA")) java.lang.Double)
                                          (str (java.lang.Math/round (tr "SIFRA")))
                                          (str (tr "SIFRA")))    
                              :tr/ed (java.lang.Math/round (tr "FK_ED"))})

(defn naknadni-unos-tr [sifra,naziv,ed] (.get (.transact conn
                                                [{:db/id #db/id[:db.part/user] 
                                                  :tr/naziv  naziv
                                                  :tr/sifra (provjera-sifre sifra) 
                                                  :tr/ed (if (= (type ed) java.lang.Double)
                                                            (java.lang.Math/round ed)
                                                            (java.lang.Math/round (java.lang.Double/parseDouble (str ed))))}])))

(defn unos-svih-tr [putanja]  (d/transact conn (map procitaj-tr (:rows (svi-tr putanja)))))

;; pronadji tr

(defn pronadji-tr[sifra]   (let [tr-sifra (provjera-sifre sifra)] 
                             (first (d/q '[:find ?c
                                         :in $ ?s
                                         :where [?c :tr/sifra ?s]]
                                       (d/db conn)
                                       tr-sifra))))

;; unos stanja

(defn sva-stanja [putanja] (read-xls putanja))


(defn provjera-tr[sifra,naziv,ed] (if (= (pronadji-tr sifra) nil)
                                                   (do (naknadni-unos-tr sifra naziv ed)
                                                        (pronadji-tr sifra))
                                                   (pronadji-tr sifra)))

(defn procitaj-stanje [st] {:db/id (new-user-id)
                              :stanje-billing/kontolno-MM (provjera-integer (st "KONTROLNO_MM")) 
                              :stanje-billing/amm-kontrolno (st "AMM_KONTROLNO_BROJILO")
                              :stanje-billing/ukupno (provjera-integer (st "UKUPNO"))
                              :stanje-billing/direktno (provjera-integer (st "DIREKTNO"))
                              :stanje-billing/poluindirektno (provjera-integer (st "POLUINDIREKTNO"))
                              :stanje-billing/amm (provjera-integer (st "AMM"))
                              :stanje-billing/amm-direktno (provjera-integer (st "AMM_DIREKTNO"))
                              :stanje-billing/amm-poluindirektno (provjera-integer (st "AMM_POLUINDIREKTNO"))
                              :stanje-billing/datum-importa (java.util.Date.)
                              :stanje-billing/datum-izvjestaja  (java.util.Date.)
                              :stanje-billing/tr (provjera-tr (str (st "TRAFOSTANICA")) (str (st "NAZIV")) (str (st "ORGBR")))})


(defn unos-svih-stanja [putanja]  (d/transact conn (map procitaj-stanje (:rows (sva-stanja putanja)))))


;; unos gubitaka

(defn svi-gubici [putanja] (read-xls putanja))

(defn procitaj-gubitke [g] {:db/id (new-user-id)
                            :gubici/mjesto_mjerenja (provjera-integer (g "MESTO_MERENJA"))
                            :gubici/kmm_amm (str (g "KMM - AMM"))
                            :gubici/en_trafostanice (provjera-prazna-celija (g "ENERGIJA_TS"))
                            :gubici/en_potrosaca (provjera-prazna-celija (g "ENERGIJA_PO"))
                            :gubici/gubici (provjera-prazna-celija (g "Gubici - KWH"))
                            :gubici/gubici_proc (java.lang.Double/parseDouble (str (dijeljenje (g "Gubici - KWH") (g "ENERGIJA_TS"))))
                            :gubici/broj_MM (provjera-integer (g "Broj MM"))
                            :gubici/broj_MM_daljinsko (provjera-integer (g "Broj MM-dalj.ocit"))
                            :gubici/proc_kompletnosti (java.lang.Double/parseDouble (str (dijeljenje (provjera-integer (g "Broj MM-dalj.ocit")) (provjera-integer (g "Broj MM")))))
                            :gubici/nacin_unosa (str (g "Nacin unosa"))
                            :gubici/datum-importa (java.util.Date.)
                            :gubici/datum-izvjestaja  (java.util.Date.)
                            :gubici/tr (provjera-tr (str (g "TRAFOSTANICA")) (str (g "NAZIV")) (str (g "ORGBR")))})


(defn unos-svih-gubitaka [putanja]  (d/transact conn (map procitaj-gubitke (:rows (svi-gubici putanja)))))

  

;; putanje

(def putanja-ed "C:/Users/user/Desktop/epcg dip/ed.xlsx" )
(def putanja-tr "C:/Users/user/Desktop/epcg dip/tr2.xlsx")
(def putanja-stanje "C:/Users/user/Desktop/epcg dip/stanje.xls")
(def putanja-gubici "C:/Users/user/Desktop/epcg dip/Gubici2.xls")


