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

type whiteboardsRepository struct {
	Context    context.Context
	Collection *mongo.Collection
}

type IWhiteboardsRepository interface {
	InsertWhiteboard(data entities.CreatedWhiteboardModel) (string, error)
	FindByID(whiteboardID primitive.ObjectID) (*entities.WhiteboardDataModel, error)
	UpdateWhiteboard(whiteboardID primitive.ObjectID, data entities.UpdatedWhiteboardModel) error
	DeleteWhiteboardByID(whiteboardID primitive.ObjectID) error
}

func NewWhiteboardsRepository(db *MongoDB) IWhiteboardsRepository {
	return &whiteboardsRepository{
		Context:    db.Context,
		Collection: db.MongoDB.Database(os.Getenv("DATABASE_NAME")).Collection("whiteboards"),
	}
}

func (repo *whiteboardsRepository) InsertWhiteboard(data entities.CreatedWhiteboardModel) (string, error) {
	insertData, err := repo.Collection.InsertOne(repo.Context, data)
	if err != nil {
		fiberlog.Errorf("Whiteboards -> Insert new whiteboard: %s \n", err)
		return "", err
	}
	return insertData.InsertedID.(primitive.ObjectID).Hex(), nil
}

func (repo *whiteboardsRepository) FindByID(whiteboardID primitive.ObjectID) (*entities.WhiteboardDataModel, error) {
	var whiteboard entities.WhiteboardDataModel
	filter := bson.M{"_id": whiteboardID}
	err := repo.Collection.FindOne(repo.Context, filter).Decode(&whiteboard)
	// if err != nil || user == (entities.PinDataModel{}) {
	if err != nil {
		return &whiteboard, err
	}
	return &whiteboard, nil
}

func (repo *whiteboardsRepository) UpdateWhiteboard(whiteboardID primitive.ObjectID, data entities.UpdatedWhiteboardModel) error {

	filter := bson.M{"_id": whiteboardID}
	update := bson.M{}
	setData := bson.M{}

	if data.Day != 0 {
		setData["day"] = data.Day
	}

	switch data.PinsChangeType {
	case "add":
		update["$addToSet"] = bson.M{"pins": bson.M{"$each": data.Pins}}
	case "remove":
		update["$pull"] = bson.M{"pins": bson.M{"$in": data.Pins}}
	case "set":
		setData["pins"] = data.Pins
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
		fiberlog.Errorf("Whiteboards -> UpdateWhiteboard: %s \n", err)
		return err
	}

	// Check if any document was modified
	if result.MatchedCount == 0 {
		fiberlog.Warnf("Whiteboards -> UpdateWhiteboard: No document found with ID: %s \n", whiteboardID)
		return errors.New("whiteboard not found")
	}

	return nil
}

func (repo *whiteboardsRepository) DeleteWhiteboardByID(whiteboardID primitive.ObjectID) error {
	filter := bson.M{"_id": whiteboardID}
	result, err := repo.Collection.DeleteOne(repo.Context, filter)
	if err != nil {
		fiberlog.Errorf("Whiteboards -> DeleteWhiteboardByID: %s \n", err)
		return err
	}

	if result.DeletedCount == 0 {
		fiberlog.Warnf("Whiteboards -> DeleteWhiteboardByID: No document found with ID: %s \n", whiteboardID.Hex())
		return errors.New("whiteboard not found")
	}
	return nil
}
