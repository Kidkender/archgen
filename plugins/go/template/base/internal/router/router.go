package router

import (
	"{{MODULE_PATH}}/internal/config"
	"{{MODULE_PATH}}/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
	// @addon-imports
)

func New(cfg *config.Config, db *gorm.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	h := handlers.New(db)

	r.Get("/health", h.Health)

	// @addon-routes

	return r
}
