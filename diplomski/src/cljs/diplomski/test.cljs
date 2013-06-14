(ns cljs.diplomski.al
  (:require-macros [cljs.diplomski.al :as foo])
  (:require [clojure.browser.event :as event]
            [goog.net.XhrIo :as xhr])
 )
;(defn datum1[] "2013-06-12")
;(.write js/document "<form id=\"f1\">")
(.write js/document "Procenat kompletnosti (0-1):<br/><input type=\"text\" name=\"kompletnost\" id=\"ptext\"><br/><br/><br/>")
(.write js/document "<input type=\"checkbox\" name=\"Daljinskim\" id=\"dcbox\">Čitanje daljinskim putem<br/><br/><br/>")

(.write js/document "Izaberite datum:")
(.write js/document (foo/cmb))
(.write js/document "<br/><br/><br/>")

(.write js/document "<input type=\"button\" id=\"search-btn\" value=\"Prikaži podatke\" />")

;;(.write js/document (foo/mes1 "2013-06-12"))
;(.write js/document "<p id=\"p1\">EVO GAA</p>")
;(.write js/document "</form>")



;(defn get-combo-box-text[] (.value (.getElementById js/document "cmb")))

(def percent-textbox (.getElementById js/document "ptext"))
(def remotely-checkbox (.getElementById js/document "dcbox"))
(def search-button (.getElementById js/document "search-btn"))

(defn datum[] (.-value(.getElementById js/document "cmb")))
(defn procenat[] (.-value percent-textbox))
(defn vrati-procenat[] (if (= "" (procenat))
                         "-1"
                         (str (procenat))))
(defn checked[] (if (= true (.-checked remotely-checkbox))
                  "1"
                  "0"))

(defn build-link[] (str "http://ivanlt:3000/tbl/" (datum) "/" (vrati-procenat) "/" (checked)))


;(def url "/tbl")
;
;(defn receive-result [event]
;  (.write js/document (.getResponseText (.-target event)))
;)
;
;(defn post-for-eval []
;(xhr/send url receive-result "GET"))

(defn open-link []
  (.open js/window (build-link)))




(defn write-something[] (.write js/document 
                          (build-link)
                          ;(str "http://localhost:3000" "/" (datum) "/" (procenat) "/" (checked))
                          ))

(event/listen 
	search-button 
	"click"
  (fn [] (open-link)))

;(defn asdfg[]
;    (if (nil? (datum1))
;      (.write js/document "aaa")
;      (.write js/document (foo/mes1 (datum1)))))

; (fn [] (foo/mes1 (.-value(.getElementById js/document "cmb"))))) 

;(event/listen 
;	search-button 
;	"click"
; (fn [] (js/alert "heeeeloooo")))

;(defn init [] 
 ; ; verify that js/document exists and that it has a getElementById
  ;; property
  ;(if (and js/document
   ;   (.-getElementById js/document))
    ;; get loginForm by element id and set its onsubmit property to
    ;; our validate-form function
   ;(let [form1 (.getElementById js/document "f1")]
    ;  (set! (.-onsubmit form1) create-paragraph))))

; initialize the HTML page in unobtrusive way
;(set! (.-onload js/window) init)


;(defn create-button []
;  (let [a (.getElementBId js/document "tijelo")]
;    (set! (.-innerHTML a) (xplus))
;    a))

;;(defn init [] (create-button))

;;(create-button)








