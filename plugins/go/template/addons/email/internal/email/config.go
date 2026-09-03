package email

import "os"

type Config struct {
	Host        string
	Port        string
	Username    string
	Password    string
	FromAddress string
	FromName    string
}

func LoadConfig() *Config {
	return &Config{
		Host:        getEnv("MAIL_HOST", "smtp.gmail.com"),
		Port:        getEnv("MAIL_PORT", "587"),
		Username:    getEnv("MAIL_USERNAME", ""),
		Password:    getEnv("MAIL_PASSWORD", ""),
		FromAddress: getEnv("MAIL_FROM_ADDRESS", ""),
		FromName:    getEnv("MAIL_FROM_NAME", "{{PROJECT_NAME}}"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
