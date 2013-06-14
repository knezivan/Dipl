(ns diplomski.core
  (:use [liberator.core :only [defresource]]))

(defresource my-first-resource
  :available-media-types ["text/html" "text/plain"])

(defn -main
  "I don't do a whole lot."
  [& args]
  (println "Hello, World!"))
