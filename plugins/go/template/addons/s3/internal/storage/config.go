package storage

import "os"

type Config struct {
	Bucket          string
	Region          string
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
}

func LoadConfig() *Config {
	return &Config{
		Bucket:          getEnv("S3_BUCKET", ""),
		Region:          getEnv("S3_REGION", "us-east-1"),
		Endpoint:        getEnv("S3_ENDPOINT", ""),
		AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
