package router

import (
	"{{MODULE_PATH}}/internal/config"
	"{{MODULE_PATH}}/internal/handlers"
	authmw "{{MODULE_PATH}}/internal/middleware"
	"{{MODULE_PATH}}/internal/services"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm"
)

func New(cfg *config.Config, db *gorm.DB) *chi.Mux {
	r := chi.NewRouter()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)

	authSvc := services.NewAuthService(db, cfg.JWTSecret)
	h := handlers.New(db, authSvc)

	r.Get("/health", h.Health)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", h.Register)
		r.Post("/auth/login", h.Login)

		r.Group(func(r chi.Router) {
			r.Use(authmw.Auth(authSvc))
			r.Get("/users", h.ListUsers)
			r.Get("/users/me", h.Me)
			r.Get("/users/{id}", h.GetUser)
		})
	})

	return r
}
