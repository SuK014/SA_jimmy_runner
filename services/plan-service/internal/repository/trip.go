package repository

import (
	"context"
	"errors"
	"os"

	. "github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/store/datasource"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"

	fiberlog "github.com/gofiber/fiber/v2/log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type tripsRepository struct {
	Context    context.Context
	Collection *mongo.Collection
}

type ITripsRepository interface {
	InsertTrip(data entities.CreatedTripModel) (string, error)
	FindByID(tripID primitive.ObjectID) (*entities.TripDataModel, error)
	UpdateTrip(tripID primitive.ObjectID, data entities.UpdatedTripModel) error
	DeleteTripByID(tripID primitive.ObjectID) error
}

func NewTripsRepository(db *MongoDB) ITripsRepository {
	return &tripsRepository{
		Context:    db.Context,
		Collection: db.MongoDB.Database(os.Getenv("DATABASE_NAME")).Collection("trips"),
	}
}

func (repo *tripsRepository) InsertTrip(data entities.CreatedTripModel) (string, error) {
	insertData, err := repo.Collection.InsertOne(repo.Context, data)
	if err != nil {
		fiberlog.Errorf("Trips -> Insert new trip: %s \n", err)
		return "", err
	}
	return insertData.InsertedID.(primitive.ObjectID).Hex(), nil
}

func (repo *tripsRepository) FindByID(tripID primitive.ObjectID) (*entities.TripDataModel, error) {
	var trip entities.TripDataModel
	filter := bson.M{"_id": tripID}
	err := repo.Collection.FindOne(repo.Context, filter).Decode(&trip)
	// if err != nil || user == (entities.PinDataModel{}) {
	if err != nil {
		return &trip, err
	}
	return &trip, nil
}

func (repo *tripsRepository) UpdateTrip(tripID primitive.ObjectID, data entities.UpdatedTripModel) error {

	filter := bson.M{"_id": tripID}
	update := bson.M{}
	setData := bson.M{}

	if data.Name != "" {
		setData["name"] = data.Name
	}
	if data.Description != "" {
		setData["description"] = data.Description
	}

	switch data.WhiteboardsChangeType {
	case "add":
		update["$addToSet"] = bson.M{"whiteboards": bson.M{"$each": data.Whiteboards}}
	case "remove":
		update["$pull"] = bson.M{"whiteboards": bson.M{"$in": data.Whiteboards}}
	case "set":
		setData["pins"] = data.Whiteboards
	}

	if len(setData) > 0 {
		update["$set"] = setData
	}

	if len(update) == 0 {
		return errors.New("no update operations provided")
	}

	// Perform the update operation
	result, err := repo.Collection.UpdateOne(repo.Context, filter, update)
	if err != nil {
		fiberlog.Errorf("Trips -> UpdateTrip: %s \n", err)
		return err
	}

	// Check if any document was modified
	if result.MatchedCount == 0 {
		fiberlog.Warnf("Trips -> UpdateTrip: No document found with ID: %s \n", tripID.Hex())
		return errors.New("trip not found")
	}

	return nil
}

func (repo *tripsRepository) DeleteTripByID(tripID primitive.ObjectID) error {
	filter := bson.M{"_id": tripID}
	result, err := repo.Collection.DeleteOne(repo.Context, filter)
	if err != nil {
		fiberlog.Errorf("Trips -> DeleteTripByID: %s \n", err)
		return err
	}

	if result.DeletedCount == 0 {
		fiberlog.Warnf("Trips -> DeleteTripByID: No document found with ID: %s \n", tripID.Hex())
		return errors.New("Trip not found")
	}
	return nil
}
