package messaging

import (
	user "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	// pb "github.com/SuK014/SA_jimmy_runner/shared/proto/trip"
)

const (
	RegisterNotiQueue = "register_noti"
	DeadLetterQueue   = "dead_letter_queue"
)

type RegisterData struct {
	User    user.CreateUserResponse `json:"user"`
	Context string                  `json:"ctx"`
}
