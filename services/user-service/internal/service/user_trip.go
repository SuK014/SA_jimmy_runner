package service

import (
	repositories "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
)

type userTripService struct {
	UserTripRepository repositories.IUserTripRepository
}

type IUserTripService interface {
	InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error)
	GetAvatars(tripID string, profileData *[]entities.UserDataModel) (*[]entities.AvatarUserModel, error)
	FindManyTripsByUserID(userID string) (*entities.UserTripsModel, error)
	FindByID(tripID, userID string) (*entities.UserTripModel, error)
	UpdateUsername(tripID, userID, name string) (*entities.UserTripModel, error)
	DeleteByID(tripID, userID string) error
	DeleteByUserID(userID string) error
	DeleteByTripID(tripID string) error
}

func NewUserTripService(repo0 repositories.IUserTripRepository) IUserTripService {
	return &userTripService{
		UserTripRepository: repo0,
	}
}

func (sv *userTripService) InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error) {
	return sv.UserTripRepository.InsertManyUsers(tripID, userIDs)
}

func (sv *userTripService) GetAvatars(tripID string, profileData *[]entities.UserDataModel) (*[]entities.AvatarUserModel, error) {
	var userIDs []string
	for _, u := range *profileData {
		userIDs = append(userIDs, u.UserID)
	}
	nameData, err := sv.UserTripRepository.FindManyUsersByTripID(tripID, userIDs)
	if err != nil {
		return nil, err
	}

	// Map for fast lookup by user_id
	nameMap := make(map[string]entities.UserTripModel)
	for _, n := range *nameData {
		nameMap[n.UserID] = n
	}

	// Merge
	var result []entities.AvatarUserModel
	for _, p := range *profileData {
		u := entities.AvatarUserModel{
			ID:      p.UserID,
			Name:    p.Name,
			Profile: p.Profile,
		}

		if n, ok := nameMap[p.UserID]; ok {
			if n.Name != "" {
				u.Name = n.Name
			}
		}

		result = append(result, u)
	}

	return &result, nil
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
