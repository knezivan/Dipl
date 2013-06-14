(ns dipl-rest.all
    (:use [incanter.core] 
          [incanter.excel]
          [hiccup.core :only (html)])
    (:import [datomic Peer Util] ;; Imports only used in data loading
            [java.io FileReader]
            [java.util.Date]
            [java.lang.Math])
    (:require [clojure.pprint]
              [clojure.instant]
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

;; pocetno kreiranje

;(System/setProperty "datomic.txTimeoutMsec" "1000000")
;;(d/delete-database conn-uri)


;;(kreiranje-seme)
;;(unos-svih-lot)
;;(unos-svih-ed putanja-ed)
;;(unos-svih-tr putanja-tr)
;;(unos-svih-stanja putanja-stanje)
;;(unos-svih-gubitaka putanja-gubici)

;;provjera lot

(d/q '[:find ?c ?n ?s
     :where
     [?c :lot/naziv ?n]
     [?c :lot/skracenica ?s]]
   (d/db conn))

;; provjera ed

(seq 
         (d/q '[:find ?n ?s ?ln ?c 
              :where
              [?c :ed/naziv ?n]
              [?c :ed/sifra ?s]
              [?c :ed/lot ?l]
              [?l :lot/naziv ?ln]]
            (d/db conn)))

;; provjera tr

(seq 
         (d/q '[:find ?n ?s ?en ?c
              :where
              [?c :tr/naziv ?n]
              [?c :tr/sifra ?s]
              [?c :tr/ed ?e]
              [?e :ed/naziv ?en]]
            (d/db conn)))

;; broj tr

(d/q '[:find (count ?c)
              :where
              [?c :tr/sifra ?s]]
            (d/db conn))


;; provjera stanja

(seq 
         (d/q '[:find ?c ?km ?ak ?u ?d ?p ?a ?ad ?ap ?di ?diz ?ts ?e ?en
              :where
              [?c :stanje-billing/kontolno-MM ?km]
              [?c :stanje-billing/amm-kontrolno ?ak]
              [?c :stanje-billing/ukupno ?u]
              [?c :stanje-billing/direktno ?d]
              [?c :stanje-billing/poluindirektno ?p]
              [?c :stanje-billing/amm ?a]
              [?c :stanje-billing/amm-direktno ?ad]
              [?c :stanje-billing/amm-poluindirektno ?ap]
              [?c :stanje-billing/datum-importa ?di]
              [?c :stanje-billing/datum-izvjestaja ?diz]
              [?c :stanje-billing/tr ?t]
              [?t :tr/sifra ?ts]
              [?t :tr/ed ?e]
              [?e :ed/naziv ?en]]
            (d/db conn)))

;; broj stanja

(d/q '[:find (count ?c)
     :where
     [?c :stanje-billing/kontolno-MM ?km]]
   (d/db conn))

;; provjera gubitaka

(seq 
         (d/q '[:find ?c ?mm ?kmm ?entr ?enpot ?g ?gp ?brmm ?brmmd ?pk ?nu ?di ?diz ?ts ?e ?en
              :where
              [?c :gubici/mjesto_mjerenja ?mm]
              [?c :gubici/kmm_amm  ?kmm]
              [?c :gubici/en_trafostanice ?entr]
              [?c :gubici/en_potrosaca ?enpot]
              [?c :gubici/gubici ?g]
              [?c :gubici/gubici_proc ?gp]
              [?c :gubici/broj_MM ?brmm]
              [?c :gubici/broj_MM_daljinsko ?brmmd]
              [?c :gubici/proc_kompletnosti ?pk]
              [?c :gubici/nacin_unosa ?nu]
              [?c :gubici/datum-importa ?di]
              [?c :gubici/datum-izvjestaja ?diz]
              [?c :gubici/tr ?t]
              [?t :tr/sifra ?ts]
              [?t :tr/ed ?e]
              [?e :ed/naziv ?en]]
            (d/db conn)))

;; broj gubitaka

(d/q '[:find (count ?c)
     :where
     [?c :gubici/broj_MM ?t]]
   (d/db conn))

;; pronadji broj unesenih gubitaka gdje je proc kompletnosti vecim od odredjenog

(defn pronadji-veci-proc-kompl [broj] (d/q '[:find (count ?c)
                                             :in $ ?b
                                             :where
                                             [?c :gubici/proc_kompletnosti ?t]
                                             [(> ?t ?b)]]
                                           (d/db conn)
                                           broj))

;; pronadji zadnje unesene gubitke

(defn get-last-trans-id [] (d/t->tx (d/basis-t (d/db conn))))

(d/q `[:find (count ?c)
     :where 
     [?c :gubici/broj_MM ?t ~(get-last-trans-id)]]
   (d/db conn))


;; pronadji gubitke koji su uneseni odredjenog datum

;; sve transkacije u kojima su unoseni gubici

(defn sve-trans-gubici [] (d/q '[:find ?when ?tx
       :where 
       [?c :gubici/broj_MM _ ?tx] 
       [?tx :db/txInstant ?when]] 
     (d/db conn)))

;; id transakcije gubitaka za odredjeni datum

(defn id-transakcije-za-odr-datum [datum] 
  (filter identity (map  #(if (= (format "%1$tF" (first %)) datum)
                            (second %))  
                         (seq (d/q '[:find ?when ?tx
                                     :where 
                                     [?c :gubici/broj_MM _ ?tx] 
                                     [?tx :db/txInstant ?when]] 
                                   (d/db conn))))))

;; gubici za datum
 
(defn gubici-za-odredjeni-datum [broj-trans broj] 
                                          (d/q '[:find ?c ?mm ?kmm ?entr ?enpot ?g ?gp ?brmm ?brmmd ?pk ?nu ?di ?diz ?ts ?e ?en
                                                 :in $ ?b ?b2
                                                 :where
                                                 [?c :gubici/broj_MM ?brmm ?b]
                                                 [?c :gubici/mjesto_mjerenja ?mm]
                                                 [?c :gubici/kmm_amm  ?kmm]
                                                 [?c :gubici/en_trafostanice ?entr]
                                                 [?c :gubici/en_potrosaca ?enpot]
                                                 [?c :gubici/gubici ?g]
                                                 [?c :gubici/gubici_proc ?gp]
                                                 [?c :gubici/broj_MM_daljinsko ?brmmd]
                                                 [?c :gubici/proc_kompletnosti ?pk]
                                                 [?c :gubici/nacin_unosa ?nu]
                                                 [?c :gubici/datum-importa ?di]
                                                 [?c :gubici/datum-izvjestaja ?diz]
                                                 [?c :gubici/tr ?t]
                                                 [?t :tr/sifra ?ts]
                                                 [?t :tr/ed ?e]
                                                 [?e :ed/naziv ?en]
                                                 [(> ?pk ?b2)]]
                                             (d/db conn)
                                             broj-trans
                                             broj))

(defn gubici-za-odredjeni-datum-daljinski [broj-trans broj] 
                                          (d/q '[:find ?c ?mm ?kmm ?entr ?enpot ?g ?gp ?brmm ?brmmd ?pk ?nu ?di ?diz ?ts ?e ?en
                                                 :in $ ?b ?b2
                                                 :where
                                                 [?c :gubici/broj_MM ?brmm ?b]
                                                 [?c :gubici/mjesto_mjerenja ?mm]
                                                 [?c :gubici/kmm_amm  ?kmm]
                                                 [?c :gubici/en_trafostanice ?entr]
                                                 [?c :gubici/en_potrosaca ?enpot]
                                                 [?c :gubici/gubici ?g]
                                                 [?c :gubici/gubici_proc ?gp]
                                                 [?c :gubici/broj_MM_daljinsko ?brmmd]
                                                 [?c :gubici/proc_kompletnosti ?pk]
                                                 [?c :gubici/nacin_unosa ?nu]
                                                 [(= ?nu "Ostalo")]
                                                 [?c :gubici/datum-importa ?di]
                                                 [?c :gubici/datum-izvjestaja ?diz]
                                                 [?c :gubici/tr ?t]
                                                 [?t :tr/sifra ?ts]
                                                 [?t :tr/ed ?e]
                                                 [?e :ed/naziv ?en]
                                                 [(> ?pk ?b2)]]
                                             (d/db conn)
                                             broj-trans
                                             broj))

(gubici-za-odredjeni-datum 13194139550288 -1.0)


;;(map (comp #(if (= (format "%1$tF"(:gubici/datum-importa %)) "2013-06-08")

;; clojure.instant/read-instant-date 
;; (defn formatiraj-datum [datum] (.format (java.text.SimpleDateFormat. "yyyy-MM-dd") datum ))


(defn rezultat[] "<html><p>AKJDKLASDJKLASJKLDAS</p></html>")

(defn red [kol1 kol2 kol3 kol4 kol5 kol6 kol7 kol8 kol9 kol10 kol11 kol12 kol13 kol14 kol15] [:tr [:td kol1] [:td kol2] [:td kol3] [:td kol4] [:td kol5] [:td kol6] [:td kol7] [:td kol8] [:td kol9] [:td kol10] [:td kol11] [:td kol12] [:td kol13] [:td kol14] [:td kol15]])

 (defn podaci [datum procenat daljinski] (if (= 0 daljinski)
                                            (gubici-za-odredjeni-datum datum procenat)
                                            (gubici-za-odredjeni-datum-daljinski datum procenat)))  
 
(defn format-procenta [procenat] (str (format "%.2f" (* 100 procenat)) " %") )
  
 (defn svi-redovi [datum procenat daljinski] (map #(red (% 1) (% 2) (% 3) (% 4) (% 5) (format-procenta (% 6)) (% 7) (% 8) (% 9) (% 10) (% 11) (% 12) (% 13) (% 14) (% 15)) (podaci datum procenat daljinski)))
 
(defn comobo-opcija [vrijednost kljuc] [:option {:value kljuc}  vrijednost])

(defn sve-opcije [] (map #(comobo-opcija (format "%1$tF" (first %)) (second %)) (sve-trans-gubici)))

 (defn generate-table[datum broj procenat]
     [:table {:border "1" :id="tbl1"}
       [:tr [:th {:colspan "15" :align "center"} "NASLOV"]]
       [:tr [:th "Mjesto mjerenja"] [:th "KMM_AMM"] [:th "Energija trafostanice"] 
            [:th "Energija potrosaca"] [:th "Gubici"] [:th "Gubici proc"] 
            [:th "Daljinski MM brojila"] [:th "Broj MM"] [:th "Procenat kompletnosti"] 
            [:th "Nacin unosa"] [:th "Datum importa"] [:th "Datum izvjestaja"]
            [:th "Trafo-reon"] [:th "ED sifra"] [:th "ED naziv"]]
         (svi-redovi datum broj procenat)])
 

 
 (defn combo-box [] 
    [:select {:id "cmb"}
    (sve-opcije)])
 
 (defn special-sum
  ([] (str (+ 10 10)))
  ([x] (str (+ 10 x)))
  ([x y] (str (+ x y))))
 
 (defn uzmi-prvi-id-transakcije [datum] (first (id-transakcije-za-odr-datum datum)))
 
 (defn gtable [datum procenat citanje] 
                   (html (generate-table (uzmi-prvi-id-transakcije datum) procenat citanje)))
 
 ;

(defmacro mes1[datum456778] (gtable datum456778))


(defmacro cmb[] (html (combo-box)))




