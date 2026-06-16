package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"{{MODULE_PATH}}/internal/config"
	"{{MODULE_PATH}}/internal/router"
)

func TestHealthEndpoint(t *testing.T) {
	cfg := &config.Config{Port: "8080", JWTSecret: "test-secret"}
	r := router.New(cfg, nil)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status=ok, got %q", body["status"])
	}
}
