package services

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type tripsService struct {
	TripsRepository repository.ITripsRepository
}

type ITripsService interface {
	InsertTrip(data entities.CreatedTripModel) (string, error)
	FindByID(tripID string) (*entities.TripDataModel, error)
	UpdateTrip(tripID string, data entities.UpdatedTripModel) error
	UpdateTripImage(tripID string, image []byte) error
	DeleteTripByID(tripID string) error
}

func NewTripsService(repo0 repository.ITripsRepository) ITripsService {
	return &tripsService{
		TripsRepository: repo0,
	}
}

func (sv *tripsService) InsertTrip(data entities.CreatedTripModel) (string, error) {
	return sv.TripsRepository.InsertTrip(data)
}

func (sv *tripsService) FindByID(tripID string) (*entities.TripDataModel, error) {
	mongoID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return nil, fmt.Errorf("invalid whiteboardID: %v", err)
	}
	data, err := sv.TripsRepository.FindByID(mongoID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *tripsService) UpdateTrip(tripID string, data entities.UpdatedTripModel) error {
	mongoID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return fmt.Errorf("invalid whiteboardID: %v", err)
	}
	return sv.TripsRepository.UpdateTrip(mongoID, data)
}

func (sv *tripsService) UpdateTripImage(tripID string, image []byte) error {
	mongoID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return fmt.Errorf("invalid pinID: %v", err)
	}
	return sv.TripsRepository.UpdateTripImage(mongoID, image)
}

func (sv *tripsService) DeleteTripByID(tripID string) error {
	mongoID, err := primitive.ObjectIDFromHex(tripID)
	if err != nil {
		return fmt.Errorf("invalid whiteboardID: %v", err)
	}
	return sv.TripsRepository.DeleteTripByID(mongoID)
}
