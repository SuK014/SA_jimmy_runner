package entities

import (
	"encoding/json"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PinDataModel struct {
	PinID        string   `json:"pin_id" bson:"pin_id"`
	Image        []byte   `json:"image,omitempty" bson:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string   `json:"description,omitempty" bson:"description,omitempty"`
	Expense      string   `json:"expense,omitempty" bson:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32  `json:"location,omitempty" bson:"location,omitempty"`
	Participants []string `json:"participants,omitempty" bson:"participants,omitempty"` // capitalized to export
}

type CreatedPinGRPCModel struct {
	Image        []byte   `json:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string   `json:"description,omitempty"`
	Expense      string   `json:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32  `json:"location"`
	Participants []string `json:"participants,omitempty"` // capitalized to export
}

type CreatedPinModel struct {
	Image        []byte               `bson:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string               `bson:"description,omitempty"`
	Expense      json.RawMessage      `bson:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32              `bson:"location,omitempty"`
	Participants []primitive.ObjectID `bson:"participants,omitempty"` // capitalized to export
}
