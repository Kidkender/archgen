package handlers

import (
	"{{MODULE_PATH}}/internal/services"
	"gorm.io/gorm"
)

type Handler struct {
	db      *gorm.DB
	authSvc *services.AuthService
}

func New(db *gorm.DB, authSvc *services.AuthService) *Handler {
	return &Handler{db: db, authSvc: authSvc}
}
