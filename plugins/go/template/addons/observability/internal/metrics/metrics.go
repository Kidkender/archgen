package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Handler serves Prometheus metrics. Mount it in internal/router/router.go:
//
//	r.Handle("/metrics", metrics.Handler())
func Handler() http.Handler {
	return promhttp.Handler()
}
