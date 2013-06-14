(defproject diplomski "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}

  ;; CLJ source code path
  :source-paths ["src/clj"]
  :dependencies [[org.clojure/clojure "1.5.1"]
				[hiccup "1.0.3"]
				[crate "0.2.4"]
				[compojure "1.0.2"]
				[ring/ring-jetty-adapter "1.1.0"]
				[liberator "0.8.0"]
         [com.datomic/datomic-free "0.8.3848"]
         [incanter/incanter-core "1.4.1"]
         [incanter/incanter-excel "1.4.1"]
         [com.cemerick/pomegranate "0.2.0"]]

  ;; lein-cljsbuild plugin to build a CLJS project
  :plugins [[lein-cljsbuild "0.3.2"]]

  ;; cljsbuild options configuration
  :cljsbuild {:builds
              [{;; CLJS source code path
                :source-paths ["src/cljs"]

                ;; Google Closure (CLS) options configuration
                :compiler {;; CLS generated JS script filename
                           :output-to "resources/public/js/test.js"

                           ;; minimal JS optimization directive
                           :optimizations :whitespace

                           ;; generated JS code prettyfication
                           :pretty-print true}}]})
