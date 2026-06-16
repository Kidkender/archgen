package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	authmw "{{MODULE_PATH}}/internal/middleware"
	"{{MODULE_PATH}}/internal/models"
	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	h.db.Select("id, username, email, created_at, updated_at").Find(&users)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": users})
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}
	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": user})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(authmw.UserIDKey).(uint)
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"data": user})
}
