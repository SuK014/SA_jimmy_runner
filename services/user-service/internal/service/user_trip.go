package service

import (
	"fmt"

	repositories "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
)

type userTripService struct {
	UserTripRepository repositories.IUserTripRepository
}

type IUserTripService interface {
	InsertUser(tripID, userID string) (*entities.UserTripModel, error)
	InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error)
	FindManyUsersByTripID(tripID string) (*[]entities.UserTripModel, error)
	FindManyTripsByUserID(userID string) (*entities.UserTripsModel, error)
	FindByID(tripID, userID string) (*entities.UserTripModel, error)
	UpdateUsername(tripID, userID, name string) (*entities.UserTripModel, error)
	DeleteByID(tripID, userID string) error
	DeleteByUserID(userID string) error
	DeleteByTripID(tripID string) error
	MergeAvatar(userRes *[]entities.UserDataModel, userTripRes *[]entities.UserTripModel) (*[]entities.AvatarUserModel, error)
}

func NewUserTripService(repo0 repositories.IUserTripRepository) IUserTripService {
	return &userTripService{
		UserTripRepository: repo0,
	}
}

func (sv *userTripService) InsertUser(tripID, userID string) (*entities.UserTripModel, error) {
	return sv.UserTripRepository.Insert(tripID, userID, "")
}

func (sv *userTripService) InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error) {
	return sv.UserTripRepository.InsertManyUsers(tripID, userIDs)
}

func (sv *userTripService) FindManyUsersByTripID(tripID string) (*[]entities.UserTripModel, error) {
	return sv.UserTripRepository.FindManyUsersByTripID(tripID)
}

func (sv *userTripService) FindManyTripsByUserID(userID string) (*entities.UserTripsModel, error) {
	return sv.UserTripRepository.FindManyTripsByUserID(userID)
}

func (sv *userTripService) FindByID(tripID, userID string) (*entities.UserTripModel, error) {
	return sv.UserTripRepository.FindByID(tripID, userID)
}

func (sv *userTripService) UpdateUsername(tripID, userID, name string) (*entities.UserTripModel, error) {
	return sv.UserTripRepository.Update(tripID, userID, name)
}

func (sv *userTripService) DeleteByID(tripID, userID string) error {
	return sv.UserTripRepository.DeleteByID(tripID, userID)
}

func (sv *userTripService) DeleteByUserID(userID string) error {
	return sv.UserTripRepository.DeleteByUserID(userID)
}

func (sv *userTripService) DeleteByTripID(tripID string) error {
	return sv.UserTripRepository.DeleteByTripID(tripID)
}

func (sv *userTripService) MergeAvatar(userRes *[]entities.UserDataModel, userTripRes *[]entities.UserTripModel) (*[]entities.AvatarUserModel, error) {
	if userRes == nil || userTripRes == nil {
		return nil, fmt.Errorf("MergeAvatar: input slices cannot be nil")
	}

	// Build a quick lookup for trip data by UserID
	tripMap := make(map[string]string)
	for _, trip := range *userTripRes {
		tripMap[trip.UserID] = trip.Name
	}

	var merged []entities.AvatarUserModel
	for _, user := range *userRes {
		tripName, exists := tripMap[user.UserID]

		// Decide which name to use
		name := user.Name
		if exists && tripName != "" {
			name = tripName
		}

		merged = append(merged, entities.AvatarUserModel{
			ID:      user.UserID,
			Name:    name,
			Profile: user.Profile,
		})
	}

	return &merged, nil
}
