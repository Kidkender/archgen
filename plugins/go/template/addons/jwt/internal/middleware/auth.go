package middleware

import (
	"context"
	"net/http"
	"strings"

	"{{MODULE_PATH}}/internal/services"
)

type contextKey string

const UserIDKey contextKey = "userID"

func Auth(authSvc *services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"error":"missing or invalid authorization header"}`, http.StatusUnauthorized)
				return
			}
			claims, err := authSvc.ValidateToken(strings.TrimPrefix(header, "Bearer "))
			if err != nil {
				w.Header().Set("Content-Type", "application/json")
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
