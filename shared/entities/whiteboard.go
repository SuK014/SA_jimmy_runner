package entities

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WhiteboardDataModel struct {
	ID           primitive.ObjectID `json:"_id,omitempty" bson:"_id"`
	WhiteboardID string             `json:"whiteboard_id"`
	Pins         []string           `json:"pins" bson:"pins"`
	Day          int                `json:"day" bson:"day"`
}

type CreatedWhiteboardModel struct {
	Pins []string `json:"pins" bson:"pins"`
	Day  int      `json:"day" bson:"day"`
}

type UpdatedWhiteboardModel struct {
	Pins           []string `json:"pins,omitempty" bson:"pins,omitempty"`
	PinsChangeType string   `json:"pins_change_type,omitempty"` // add, remove, set
	Day            int      `json:"day,omitempty" bson:"day,omitempty"`
}
