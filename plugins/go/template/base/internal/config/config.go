package config

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBUrl     string
	JWTSecret string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		slog.Warn("no .env file found, using environment variables")
	}
	return &Config{
		Port:      getEnv("PORT", "8080"),
		DBUrl:     getEnv("DATABASE_URL", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
