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
	UpdatePin(pinID string, data entities.UpdatedPinModel) error
}

func NewPinsService(repo0 repository.IPinsRepository) IPinsService {
	return &pinsService{
		PinsRepository: repo0,
	}
}

func (sv *pinsService) FindByParticipant(userID string) (*[]entities.PinDataModel, error) {
	data, err := sv.PinsRepository.FindByParticipant(userID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) FindByID(pinID string) (*entities.PinDataModel, error) {
	mongoPinID, err := primitive.ObjectIDFromHex(pinID)
	if err != nil {
		return nil, fmt.Errorf("invalid userID: %v", err)
	}
	data, err := sv.PinsRepository.FindByID(mongoPinID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) InsertPin(data entities.CreatedPinModel) (string, error) {
	return sv.PinsRepository.InsertPin(data)
}

func (sv *pinsService) UpdatePin(pinID string, data entities.UpdatedPinModel) error {
	return sv.PinsRepository.UpdatePin(pinID, data)
}
