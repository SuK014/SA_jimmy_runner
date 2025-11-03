package entities

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PinDataModel struct {
	ID           primitive.ObjectID `json:"_id,omitempty" bson:"_id"`
	PinID        string             `json:"pin_id"`
	Name         string             `json:"name,omitempty" bson:"name,omitempty"`
	Image        []byte             `json:"image,omitempty" bson:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string             `json:"description,omitempty" bson:"description,omitempty"`
	Expenses     []Expense          `json:"expenses,omitempty" bson:"expenses,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32            `json:"location,omitempty" bson:"location,omitempty"`
	Participants []string           `json:"participants,omitempty" bson:"participants,omitempty"` // capitalized to export
}

type CreatedPinModel struct {
	Name         string    `json:"name,omitempty" bson:"name,omitempty"`
	Image        []byte    `bson:"image,omitempty"` // for binary data (e.g. uploaded image)
	Description  string    `bson:"description,omitempty"`
	Expenses     []Expense `bson:"expenses,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32   `bson:"location,omitempty"`
	Participants []string  `bson:"participants,omitempty"` // capitalized to export
}

type UpdatedPinModel struct {
	Name         string    `json:"name,omitempty" bson:"name,omitempty"`
	Description  string    `json:"description,omitempty" bson:"description,omitempty"`
	Expenses     []Expense `json:"expenses,omitempty" bson:"expenses,omitempty"` // for arbitrary JSON (e.g. map or array)
	Location     float32   `json:"location,omitempty" bson:"location,omitempty"`
	Participants []string  `json:"participants,omitempty" bson:"participants,omitempty"` // capitalized to export
}

type Expense struct {
	ID      string  `json:"user_id,omitempty" bson:"user_id,omitempty"`
	Name    string  `json:"name,omitempty" bson:"name,omitempty"`
	Expense float32 `json:"expense,omitempty" bson:"expense,omitempty"`
}
