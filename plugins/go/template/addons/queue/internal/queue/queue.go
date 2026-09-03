package queue

import (
	"encoding/json"
	"os"

	"github.com/hibiken/asynq"
)

const TaskExample = "example:task"

func RedisAddr() string {
	if v := os.Getenv("REDIS_ADDR"); v != "" {
		return v
	}
	return "localhost:6379"
}

func NewClient() *asynq.Client {
	return asynq.NewClient(asynq.RedisClientOpt{Addr: RedisAddr()})
}

type ExamplePayload struct {
	Message string `json:"message"`
}

// NewExampleTask builds a task processed by the example worker
// (see cmd/worker/main.go). Enqueue it with client.Enqueue(queue.NewExampleTask(...)).
func NewExampleTask(message string) (*asynq.Task, error) {
	payload, err := json.Marshal(ExamplePayload{Message: message})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TaskExample, payload), nil
}
