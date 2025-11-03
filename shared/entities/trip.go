package entities

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TripDataModel struct {
	ID          primitive.ObjectID `json:"_id,omitempty" bson:"_id"`
	TripID      string             `json:"trip_id"`
	Name        string             `json:"name" bson:"name"`
	Description string             `json:"description,omitempty" bson:"description,omitempty"`
	Image       []byte             `json:"image,omitempty" bson:"image,omitempty"` // for binary data (e.g. uploaded image)
	Whiteboards []string           `json:"whiteboards" bson:"whiteboards"`
}

type CreatedTripModel struct {
	Name        string   `json:"name" bson:"name"`
	Description string   `json:"description,omitempty" bson:"description,omitempty"`
	Whiteboards []string `bson:"whiteboards"` // no json: use new gen
}

type UpdatedTripModel struct {
	Name                  string   `json:"name,omitempty" bson:"name,omitempty"`
	Description           string   `json:"description,omitempty" bson:"description,omitempty"`
	Whiteboards           []string `json:"whiteboards,omitempty" bson:"whiteboards,omitempty"`
	WhiteboardsChangeType string   `json:"whiteboards_change_type,omitempty"` // add, remove, set
}
