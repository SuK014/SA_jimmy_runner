// internal/services/service.go
package services

import (
	"encoding/json"
	"fmt"
	"gopkg.in/gomail.v2"
	"log"
)

type NotificationService struct {
	repo NotificationRepository
}

func NewNotificationService(r NotificationRepository) *NotificationService {
	return &NotificationService{repo: r}
}

type VerificationEmail struct {
	To   string `json:"to"`
	OTP  string `json:"otp"`
	Type string `json:"type"`
}

func (n *NotificationService) HandleMessage(data []byte) {
	var msg VerificationEmail
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("❌ Failed to parse message: %v", err)
		return
	}

	if msg.Type == "verification" {
		subject := "Verify your account"
		body := fmt.Sprintf("Your OTP code is: %s", msg.OTP)
		if err := n.SendEmail(msg.To, subject, body); err != nil {
			log.Printf("❌ Failed to send email: %v", err)
		}
	}
}

func (n *NotificationService) SendEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", "yourapp@gmail.com")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, "yourapp@gmail.com", "app-password")

	return d.DialAndSend(m)
}
