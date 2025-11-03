package services

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type pinsService struct {
	PinsRepository repository.IPinsRepository
}

type IPinsService interface {
	InsertPin(data entities.CreatedPinModel) (string, error)
	FindByID(pinID string) (*entities.PinDataModel, error)
	FindByParticipant(userID string) (*[]entities.PinDataModel, error)
	FindManyByID(pinIDs []string) (*[]entities.PinDataModel, error)
	UpdatePin(pinID string, data entities.UpdatedPinModel) error
	UpdatePinImage(pinID string, image []byte) error
	DeletePinByID(pinID string) error
	DeleteManyByID(pinIDs []string) error
}

func NewPinsService(repo0 repository.IPinsRepository) IPinsService {
	return &pinsService{
		PinsRepository: repo0,
	}
}

func (sv *pinsService) InsertPin(data entities.CreatedPinModel) (string, error) {
	return sv.PinsRepository.InsertPin(data)
}

func (sv *pinsService) FindByID(pinID string) (*entities.PinDataModel, error) {
	mongoID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		return nil, fmt.Errorf("invalid userID: %v", err)
	}
	data, err := sv.PinsRepository.FindByID(mongoID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) FindByParticipant(userID string) (*[]entities.PinDataModel, error) {
	data, err := sv.PinsRepository.FindByParticipant(userID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) FindManyByID(pinIDs []string) (*[]entities.PinDataModel, error) {

	mongoIDs := []primitive.ObjectID{}
	for _, p := range pinIDs {
		mongoID, err := primitive.ObjectIDFromHex(p)
		if err != nil {
			return nil, fmt.Errorf("invalid userID: %v", err)
		}
		mongoIDs = append(mongoIDs, mongoID)
	}
	data, err := sv.PinsRepository.FindManyByID(mongoIDs)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) UpdatePin(pinID string, data entities.UpdatedPinModel) error {
	mongoID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		return fmt.Errorf("invalid userID: %v", err)
	}
	return sv.PinsRepository.UpdatePin(mongoID, data)
}

func (sv *pinsService) UpdatePinImage(pinID string, image []byte) error {
	mongoID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		return fmt.Errorf("invalid userID: %v", err)
	}
	return sv.PinsRepository.UpdatePinImage(mongoID, image)
}

func (sv *pinsService) DeletePinByID(pinID string) error {
	mongoID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		return fmt.Errorf("invalid userID: %v", err)
	}
	return sv.PinsRepository.DeletePinByID(mongoID)
}

func (sv *pinsService) DeleteManyByID(pinIDs []string) error {
	mongoIDs := []primitive.ObjectID{}
	for _, p := range pinIDs {
		mongoID, err := primitive.ObjectIDFromHex(p)
		if err != nil {
			return fmt.Errorf("invalid userID: %v", err)
		}
		mongoIDs = append(mongoIDs, mongoID)
	}
	return sv.PinsRepository.DeleteManyByID(mongoIDs)
}
