package ws

import (
	"log/slog"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Same-origin only by default; relax this if the frontend is served
	// from a different origin.
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Client struct {
	conn *websocket.Conn
}

func (c *Client) send(message []byte) {
	if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
		slog.Warn("ws write failed", "error", err)
	}
}

// Handler upgrades the request to a WebSocket connection after validating the
// `token` query param as a JWT (see internal/config JWTSecret). The claims'
// `userId` field groups connections per user for Hub.SendToUser.
func Handler(hub *Hub, jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := r.URL.Query().Get("token")
		claims := jwt.MapClaims{}
		_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil {
			http.Error(w, "invalid or missing token", http.StatusUnauthorized)
			return
		}
		userID, _ := claims["userId"].(string)

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			slog.Error("ws upgrade failed", "error", err)
			return
		}
		client := &Client{conn: conn}
		hub.register(userID, client)
		defer func() {
			hub.unregister(userID, client)
			_ = conn.Close()
		}()

		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}
}
