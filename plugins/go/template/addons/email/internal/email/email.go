package email

import (
	"fmt"
	"net/smtp"
)

type Service struct {
	cfg *Config
}

func NewService(cfg *Config) *Service {
	return &Service{cfg: cfg}
}

// Send delivers a plain-text email via SMTP (STARTTLS on the configured host/port).
func (s *Service) Send(to, subject, body string) error {
	from := fmt.Sprintf("%s <%s>", s.cfg.FromName, s.cfg.FromAddress)
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s\r\n", from, to, subject, body)

	auth := smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
	addr := fmt.Sprintf("%s:%s", s.cfg.Host, s.cfg.Port)
	return smtp.SendMail(addr, auth, s.cfg.FromAddress, []string{to}, []byte(msg))
}

func (s *Service) SendWelcome(to, name string) error {
	return s.Send(to, "Welcome!", fmt.Sprintf("Hi %s,\n\nWelcome aboard!", name))
}

func (s *Service) SendPasswordReset(to, resetLink string) error {
	return s.Send(to, "Reset your password", fmt.Sprintf("Reset your password here: %s", resetLink))
}

func (s *Service) SendNotification(to, subject, body string) error {
	return s.Send(to, subject, body)
}
