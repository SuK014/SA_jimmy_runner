package services

import (
	"encoding/json"
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type pinsService struct {
	PinsRepository repository.IPinsRepository
}

type IPinsService interface {
	InsertPin(data entities.CreatedPinGRPCModel) error
	FindByID(pinID string) (*entities.PinDataModel, error)
	FindByParticipant(userID string) (*[]entities.PinDataModel, error)
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
	data, err := sv.PinsRepository.FindByID(pinID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *pinsService) InsertPin(data entities.CreatedPinGRPCModel) error {
	expense := json.RawMessage(data.Expense)

	var participants []primitive.ObjectID
	for _, idStr := range data.Participants {
		objID, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			return fmt.Errorf("invalid participant id: %s", idStr)
		}
		participants = append(participants, objID)
	}

	insertData := entities.CreatedPinModel{
		Image:        data.Image,
		Description:  data.Description,
		Expense:      expense,
		Location:     data.Location,
		Participants: participants,
	}
	return sv.PinsRepository.InsertPin(insertData)
}
