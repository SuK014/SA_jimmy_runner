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
	FindManyByID(pinIDs []primitive.ObjectID) (*[]entities.PinDataModel, error)
	UpdatePin(pinID primitive.ObjectID, data entities.UpdatedPinModel) error
	UpdatePinImage(pinID primitive.ObjectID, image []byte) error
	DeletePinByID(pinID primitive.ObjectID) error
	DeleteManyByID(pinIDs []primitive.ObjectID) error
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
		fiberlog.Errorf("Pins -> Insert new pin: %s \n", err)
		return "", err
	}
	return insertData.InsertedID.(primitive.ObjectID).Hex(), nil
}

func (repo *pinsRepository) FindByID(pinID primitive.ObjectID) (*entities.PinDataModel, error) {
	var pin entities.PinDataModel
	filter := bson.M{"_id": pinID}
	err := repo.Collection.FindOne(repo.Context, filter).Decode(&pin)
	// if err != nil || user == (entities.PinDataModel{}) {
	if err != nil {
		return &pin, err
	}
	return &pin, nil
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

func (repo *pinsRepository) FindManyByID(pinIDs []primitive.ObjectID) (*[]entities.PinDataModel, error) {
	filter := bson.M{"_id": bson.M{"$in": pinIDs}}
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

func (repo *pinsRepository) UpdatePin(pinID primitive.ObjectID, data entities.UpdatedPinModel) error {

	filter := bson.M{"_id": pinID}
	update := bson.M{"$set": data}

	// Perform the update operation
	result, err := repo.Collection.UpdateOne(repo.Context, filter, update)
	if err != nil {
		fiberlog.Errorf("Pins -> UpdatePin: %s \n", err)
		return err
	}

	// Check if any document was modified
	if result.MatchedCount == 0 {
		fiberlog.Warnf("Pins -> UpdatePin: No document found with ID: %s \n", pinID.Hex())
		return errors.New("pin not found")
	}

	return nil
}

func (repo *pinsRepository) UpdatePinImage(pinID primitive.ObjectID, image []byte) error {

	filter := bson.M{"_id": pinID}
	update := bson.M{"$set": bson.M{"image": image}}

	// Perform the update operation
	result, err := repo.Collection.UpdateOne(repo.Context, filter, update)
	if err != nil {
		fiberlog.Errorf("Pins -> UpdatePinImage: %s \n", err)
		return err
	}

	// Check if any document was modified
	if result.MatchedCount == 0 {
		fiberlog.Warnf("Pins -> UpdatePin: No document found with ID: %s \n", pinID.Hex())
		return errors.New("pin not found")
	}

	return nil
}

func (repo *pinsRepository) DeletePinByID(pinID primitive.ObjectID) error {
	filter := bson.M{"_id": pinID}
	result, err := repo.Collection.DeleteOne(repo.Context, filter)
	if err != nil {
		fiberlog.Errorf("Pins -> DeletePinByID: %s \n", err)
		return err
	}

	if result.DeletedCount == 0 {
		fiberlog.Warnf("Pins -> DeletePinByID: No document found with ID: %s \n", pinID.Hex())
		return errors.New("pin not found")
	}
	return nil
}

func (repo *pinsRepository) DeleteManyByID(pinIDs []primitive.ObjectID) error {
	filter := bson.M{"_id": bson.M{"$in": pinIDs}}
	result, err := repo.Collection.DeleteMany(repo.Context, filter)
	if err != nil {
		fiberlog.Errorf("Pins -> DeleteManyByID: %s \n", err)
		return err
	}

	if result.DeletedCount == 0 {
		fiberlog.Warnf("Pins -> DeleteManyByID: No document found with ID: %s \n", pinIDs)
		return errors.New("pin not found")
	}
	return nil
}
