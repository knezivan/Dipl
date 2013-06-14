(use 'ring.adapter.jetty)
(require '[clj.diplomski.example :as web])

(run-jetty #'web/app {:port 8080})