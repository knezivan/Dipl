   (defproject dipl-rest "0.1.0-SNAPSHOT"
      :description "REST service for documents"
      :url "http://blog.interlinked.org"
      :dependencies [[org.clojure/clojure "1.4.0"]
                     [compojure "1.1.1"]
                     [ring/ring-json "0.1.2"]
                     [c3p0/c3p0 "0.9.1.2"]
                     [org.clojure/java.jdbc "0.2.3"]
                     [com.h2database/h2 "1.3.168"]
                     [cheshire "4.0.3"]
                     [hiccup "1.0.3"]
                     [com.datomic/datomic-free "0.8.3848"]
                     [incanter/incanter-core "1.4.1"]
                     [incanter/incanter-excel "1.4.1"]]
      :plugins [[lein-ring "0.7.3"]]
      :ring {:handler dipl-rest.handler/app}
      :profiles
      {:dev {:dependencies [[ring-mock "0.1.3"]]}})
