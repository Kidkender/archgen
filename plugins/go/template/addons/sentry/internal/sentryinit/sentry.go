package sentryinit

import (
	"log/slog"
	"os"

	"github.com/getsentry/sentry-go"
)

// Init is a no-op unless SENTRY_DSN is set. Call it once at startup:
//
//	defer sentryinit.Init()()
func Init() func() {
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		return func() {}
	}

	if err := sentry.Init(sentry.ClientOptions{Dsn: dsn}); err != nil {
		slog.Error("sentry init failed", "error", err)
		return func() {}
	}
	return func() { sentry.Flush(2e9) }
}
