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

type pinsRepository struct {
	Context    context.Context
	Collection *mongo.Collection
}

type IPinsRepository interface {
	InsertPin(data entities.CreatedPinModel) (string, error)
	FindByID(pinID primitive.ObjectID) (*entities.PinDataModel, error)
	FindByParticipant(userID string) (*[]entities.PinDataModel, error)
	UpdatePin(pinID string, data entities.UpdatedPinModel) error
}

func NewPinsRepository(db *MongoDB) IPinsRepository {
	return &pinsRepository{
		Context:    db.Context,
		Collection: db.MongoDB.Database(os.Getenv("DATABASE_NAME")).Collection("pins"),
	}
}

func (repo *pinsRepository) InsertPin(data entities.CreatedPinModel) (string, error) {
	insertData, err := repo.Collection.InsertOne(repo.Context, data)
	if err != nil {
		fiberlog.Errorf("Users -> InsertNewUser: %s \n", err)
		return "", err
	}
	return insertData.InsertedID.(primitive.ObjectID).Hex(), nil
}

func (repo *pinsRepository) FindByID(pinID primitive.ObjectID) (*entities.PinDataModel, error) {
	var user entities.PinDataModel
	filter := bson.M{"_id": pinID}
	err := repo.Collection.FindOne(repo.Context, filter).Decode(&user)
	// if err != nil || user == (entities.PinDataModel{}) {
	if err != nil {
		return &user, err
	}
	return &user, nil
}

func (repo *pinsRepository) FindByParticipant(userID string) (*[]entities.PinDataModel, error) {
	filter := bson.M{"participants": userID}
	cursor, err := repo.Collection.Find(repo.Context, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(repo.Context)

	var pins []entities.PinDataModel
	if err := cursor.All(repo.Context, &pins); err != nil {
		return nil, err
	}

	for i := range pins {
		pins[i].PinID = pins[i].ID.Hex()
	}

	return &pins, nil
}

func (repo *pinsRepository) UpdatePin(pinID string, data entities.UpdatedPinModel) error {
	objectID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		fiberlog.Errorf("Users -> UpdateUserFields: Invalid ObjectID format: %s \n", err)
		return err
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": data}

	// Perform the update operation
	result, err := repo.Collection.UpdateOne(repo.Context, filter, update)
	if err != nil {
		fiberlog.Errorf("Users -> UpdateUser: %s \n", err)
		return err
	}

	// Check if any document was modified
	if result.MatchedCount == 0 {
		fiberlog.Warnf("Users -> UpdateUser: No document found with ID: %s \n", pinID)
		return errors.New("user not found")
	}

	return nil
}
