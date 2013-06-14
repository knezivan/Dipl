(ns clj.diplomski.example
  (:use [compojure.core :only [routes]]))

(routes 
  (ANY "/greeting" [] 
    (resource :handle-ok "Hello World!")))
 
 
 
 