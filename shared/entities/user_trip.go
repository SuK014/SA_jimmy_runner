package entities

type UserTripModel struct {
	UserID string `json:"user_id"`
	TripID string `json:"trip_id"`
	Name   string `json:"name,omitempty"`
}
