.PHONY: dev build run migrate-up migrate-down test lint

dev:
	air

build:
	go build -o bin/{{PROJECT_NAME}} ./cmd/server

run:
	./bin/{{PROJECT_NAME}}

migrate-up:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DATABASE_URL)" down 1

test:
	go test ./...

lint:
	golangci-lint run ./...
