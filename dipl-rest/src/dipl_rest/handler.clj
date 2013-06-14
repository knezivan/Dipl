(ns dipl-rest.handler
  (:use [compojure.core]
        )
  (:require [compojure.handler :as handler]
            [compojure.route :as route]
            [ring.util.response :as response]
            [dipl-rest.all :as dr]
   )
  )

;(defroutes app-routes
;  (GET "/" [] (dr/gtable "2013-06-12"))
;  (route/resources "/")
;  (route/not-found "Not Found"))

 (defroutes app-routes
      (context "/tbl" [] (defroutes documents-routes
        ;(GET "/" [] (dr/gtable "2013-06-12" -1.0))
        ;(GET "/:datum" [datum] (dr/gtable datum -1.0))
        (GET "/:datum/:procenat/:daljinski" [datum procenat daljinski] (dr/gtable datum (read-string procenat) (read-string daljinski)))
        ;(POST "/tbl/:id/:tr" (dr/special-sum))
        ))
        (context "/" [] (defroutes document-routes
          (GET    "/" [] "hello")))
      (route/not-found "Not Found"))

 
; (defroutes app
;(POST "/eval" ((dr/special-sum)))
;(GET "/"
;(response/resource-response "/tabela.html"))
;(route/resources "/"))

 
; (defpage "/tbl/:id" (dr/special-sum (read-string id)))
      

(def app
  (handler/site app-routes))
