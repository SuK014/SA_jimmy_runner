package services

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type whiteboardsService struct {
	WhiteboardsRepository repository.IWhiteboardsRepository
}

type IWhiteboardsService interface {
	InsertWhiteboard(data entities.CreatedWhiteboardModel) (string, error)
	FindByID(whiteboardID string) (*entities.WhiteboardDataModel, error)
	FindManyByID(whiteboardIDs []string) (*[]entities.WhiteboardDataModel, error)
	UpdateWhiteboard(whiteboardID string, data entities.UpdatedWhiteboardModel) error
	DeleteWhiteboardByID(whiteboardID string) error
	DeleteManyByID(tripIDs []string) error
}

func NewWhiteboardsService(repo0 repository.IWhiteboardsRepository) IWhiteboardsService {
	return &whiteboardsService{
		WhiteboardsRepository: repo0,
	}
}

func (sv *whiteboardsService) InsertWhiteboard(data entities.CreatedWhiteboardModel) (string, error) {
	return sv.WhiteboardsRepository.InsertWhiteboard(data)
}

func (sv *whiteboardsService) FindByID(whiteboardID string) (*entities.WhiteboardDataModel, error) {
	mongoID, err := primitive.ObjectIDFromHex(whiteboardID)
	if err != nil {
		return nil, fmt.Errorf("invalid whiteboardID: %v", err)
	}
	data, err := sv.WhiteboardsRepository.FindByID(mongoID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *whiteboardsService) FindManyByID(whiteboardIDs []string) (*[]entities.WhiteboardDataModel, error) {

	mongoIDs := []primitive.ObjectID{}
	for _, p := range whiteboardIDs {
		mongoID, err := primitive.ObjectIDFromHex(p)
		if err != nil {
			return nil, fmt.Errorf("invalid pinID: %v", err)
		}
		mongoIDs = append(mongoIDs, mongoID)
	}
	data, err := sv.WhiteboardsRepository.FindManyByID(mongoIDs)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *whiteboardsService) UpdateWhiteboard(whiteboardID string, data entities.UpdatedWhiteboardModel) error {
	mongoID, err := primitive.ObjectIDFromHex(whiteboardID)
	if err != nil {
		return fmt.Errorf("invalid whiteboardID: %v", err)
	}
	return sv.WhiteboardsRepository.UpdateWhiteboard(mongoID, data)
}

func (sv *whiteboardsService) DeleteWhiteboardByID(whiteboardID string) error {
	mongoID, err := primitive.ObjectIDFromHex(whiteboardID)
	if err != nil {
		return fmt.Errorf("invalid whiteboardID: %v", err)
	}
	return sv.WhiteboardsRepository.DeleteWhiteboardByID(mongoID)
}

func (sv *whiteboardsService) DeleteManyByID(tripIDs []string) error {
	mongoIDs := []primitive.ObjectID{}
	for _, p := range tripIDs {
		mongoID, err := primitive.ObjectIDFromHex(p)
		if err != nil {
			return fmt.Errorf("invalid pinID: %v", err)
		}
		mongoIDs = append(mongoIDs, mongoID)
	}
	return sv.WhiteboardsRepository.DeleteManyByID(mongoIDs)
}
