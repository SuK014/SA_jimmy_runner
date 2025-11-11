package entities

type UserTripModel struct {
	UserID string `json:"user_id"`
	TripID string `json:"trip_id"`
	Name   string `json:"name,omitempty"`
}

type UsersTripModel struct {
	UserID []string `json:"user_ids"`
	TripID string   `json:"trip_id"`
	Name   string   `json:"name,omitempty"`
}

type UserTripsModel struct {
	UserID string   `json:"user_id"`
	TripID []string `json:"trip_ids"`
	Name   string   `json:"name,omitempty"`
}

type AddUserModel struct {
	Email  string `json:"email"`
	TripID string `json:"trip_id"`
}
