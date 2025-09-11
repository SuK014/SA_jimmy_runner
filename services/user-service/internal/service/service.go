package service

import (
	"net/mail"

	repositories "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
)

type usersService struct {
	UsersRepository repositories.IUsersRepository
}

type IUsersService interface {
	GetAllUsers() (*[]entities.UserDataModel, error)
	InsertNewUser(data entities.CreatedUserModel) (*entities.UserDataModel, error)
	GetByID(userID string) (*entities.UserDataModel, error)
	UpdateUser(data entities.UserDataModel) (*entities.UserDataModel, error)
	DeleteUser(userID string) error
}

func NewUsersService(repo0 repositories.IUsersRepository) IUsersService {
	return &usersService{
		UsersRepository: repo0,
	}
}

func (sv *usersService) GetAllUsers() (*[]entities.UserDataModel, error) {
	data, err := sv.UsersRepository.FindAll()
	if err != nil {
		return nil, err
	}

	return data, nil

}

func (sv *usersService) GetByID(userID string) (*entities.UserDataModel, error) {
	data, err := sv.UsersRepository.FindByID(userID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *usersService) InsertNewUser(data entities.CreatedUserModel) (*entities.UserDataModel, error) {
	//check email format
	if _, err := mail.ParseAddress(data.Email); err != nil {
		return nil, err
	}

	return sv.UsersRepository.InsertUser(data)
}

func (sv *usersService) UpdateUser(data entities.UserDataModel) (*entities.UserDataModel, error) {
	// Validate email format
	if _, err := mail.ParseAddress(data.Email); err != nil {
		return nil, err
	}

	return sv.UsersRepository.UpdateUser(data)
}

func (sv *usersService) DeleteUser(userID string) error {
	if _, err := sv.UsersRepository.FindByID(userID); err != nil {
		return err
	}

	return sv.UsersRepository.DeleteUser(userID)
}
