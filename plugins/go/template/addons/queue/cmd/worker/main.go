package main

import (
	"context"
	"encoding/json"
	"log/slog"

	"{{MODULE_PATH}}/internal/queue"
	"github.com/hibiken/asynq"
)

func handleExampleTask(ctx context.Context, t *asynq.Task) error {
	var payload queue.ExamplePayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return err
	}
	slog.Info("processed example task", "message", payload.Message)
	return nil
}

func main() {
	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: queue.RedisAddr()},
		asynq.Config{Concurrency: 10},
	)

	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskExample, handleExampleTask)

	slog.Info("worker started")
	if err := srv.Run(mux); err != nil {
		slog.Error("worker stopped", "error", err)
	}
}
