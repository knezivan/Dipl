(ns cljs.diplomski.epcgs
      (:use   cljs.diplomski.epcg)
      (:require [clojure.instant]
                [datomic.api :exclude [filter] :as d]) )

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

(d/q '[:find ?when ?tx
       :where 
       [?c :gubici/broj_MM _ ?tx] 
       [?tx :db/txInstant ?when]] 
     (d/db conn))

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

(defn gubici-za-odredjeni-datum [datum] (d/q `[:find ?c ?t
                                               :where
                                               [?c :gubici/broj_MM ?t ~(first (id-transakcije-za-odr-datum datum))]]
                                             (d/db conn)))

(gubici-za-odredjeni-datum "2013-06-12")


;;(map (comp #(if (= (format "%1$tF"(:gubici/datum-importa %)) "2013-06-08")

;; clojure.instant/read-instant-date 
;; (defn formatiraj-datum [datum] (.format (java.text.SimpleDateFormat. "yyyy-MM-dd") datum ))


(defn rezultat[] "<html><p>AKJDKLASDJKLASJKLDAS</p></html>")



