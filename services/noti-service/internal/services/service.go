// internal/services/service.go
package services

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/SuK014/SA_jimmy_runner/shared/messaging"
)

func SendEmail() {
	rb, err := messaging.NewRabbitMQ(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	fmt.Println("checkpoint 1")
	event := messaging.EmailEvent{
		To:      "methasith33@gmail.com", // change to user email
		Subject: "Welcome!",
		Body:    "Hi there, thanks for signing up, fuq u!",
	}
	if err := rb.PublishMessage(context.Background(), "notification.exchange", "notification.email", event); err != nil {
		log.Printf("Failed to publish email event: %v", err)
	}
}

func StartEmailConsumers() {
	rb, err := messaging.NewRabbitMQ(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer rb.Close()

	queueName, err := rb.SetupQueue(
		"email_queue",           // queue name
		"notification.exchange", // exchange
		"direct",                // exchange type
		"notification.email",    // routing key
		true,                    // durable
		nil,                     // args
	)
	if err != nil {
		log.Fatalf("Failed to setup email queue: %v", err)
	}

	emailConsumer := messaging.NewEmailConsumer(rb, queueName, os.Getenv("GMAIL_USER"), os.Getenv("GMAIL_PASSWORD"))
	if err := emailConsumer.Start(); err != nil {
		log.Fatalf("Failed to start email consumer: %v", err)
	}
	select {} // Block forever
}
