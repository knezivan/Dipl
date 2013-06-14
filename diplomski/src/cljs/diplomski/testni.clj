(ns cljs.diplomski.testn
   (:use [hiccup.core :only (html)]
;         [cljs.diplomski.mac]
         ))

; (defn generate-table []
;     [:table {:border "1"}
;       [:tr [:th {:colspan "10" :align "center"} "NASLOV"]]
;         (svi-redovi)])
 
; (defn svi-redovi [] (map #(red (first %) (second %)) (gubici-za-odredjeni-datum "2013-06-12")))
 
 
; (defn red [kol1 kol2] [:tr [:td kol1] [:td kol2]])
   
 (defn vrati-tabelu [] [:table [:tr [:td "a"]]])

 
 ;(defn ct [] (html (generate-table)))
 
; (defmacro ct1[] (ct))
 ;(defmacro mes1[] (html (vrati-tabelu)))
(defmacro mes1[] (vrati-tabelu))
 
 
 
 