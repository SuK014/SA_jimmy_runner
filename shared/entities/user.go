package entities

import (
	"time"
)

type UserDataModel struct {
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
	Name      string    `json:"name,omitempty"`
	Email     string    `json:"email,omitempty"`
	Password  string    `json:"password,omitempty"`
	Profile   string    `json:"profile"`
}

type UserIDModel struct {
	UserID string `json:"user_id"`
}

type CreatedUserModel struct {
	Name     string `json:"name,omitempty"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginUserModel struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateUserModel struct {
	ID      string `json:"user_id,omitempty"`
	Name    string `json:"name,omitempty"`
	Profile string `json:"profile,omitempty"`
}

type AvatarUserModel struct {
	ID      string `json:"user_id,omitempty"`
	Name    string `json:"name,omitempty"`
	Profile string `json:"profile,omitempty"`
}

type AvatarResponse struct {
	TripID string   `json:"trip_id"`
	UserID []string `json:"user_id"`
}
