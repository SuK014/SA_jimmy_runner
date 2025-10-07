package entities

import (
	"encoding/json"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PinDataModel struct {
	PinID        string   `json:"pin_id"`
	Image        []byte   `json:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string   `json:"description,omitempty"`
	Expense      string   `json:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32  `json:"location,omitempty"`
	Participants []string `json:"participants,omitempty"` // capitalized to export
}

type CreatedPinGRPCModel struct {
	Image        []byte   `json:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string   `json:"description,omitempty"`
	Expense      string   `json:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32  `json:"location,omitempty"`
	Participants []string `json:"participants,omitempty"` // capitalized to export
}

type CreatedPinModel struct {
	Image        []byte               `json:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string               `json:"description,omitempty"`
	Expense      json.RawMessage      `json:"expense,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32              `json:"location,omitempty"`
	Participants []primitive.ObjectID `json:"participants,omitempty"` // capitalized to export
}
