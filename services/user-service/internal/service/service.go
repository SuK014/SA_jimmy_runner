package service

import (
	"fmt"
	"net/mail"

	repositories "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"github.com/SuK014/SA_jimmy_runner/shared/utils"
)

type usersService struct {
	UsersRepository repositories.IUsersRepository
}

type IUsersService interface {
	GetAllUsers() (*[]entities.UserDataModel, error)
	InsertNewUser(data entities.CreatedUserModel) (*entities.UserDataModel, error)
	GetByID(userID string) (*entities.UserDataModel, error)
	Login(user entities.LoginUserModel) (*entities.UserDataModel, error)
	UpdateUser(data entities.UpdateUserModel) (*entities.UserDataModel, error)
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

func (sv *usersService) Login(user entities.LoginUserModel) (*entities.UserDataModel, error) {
	data, err := sv.UsersRepository.FindByEmail(user.Email)
	if err != nil {
		return nil, err
	}

	if !utils.CheckPasswordHash(user.Password, data.Password) {
		return nil, fmt.Errorf("wrong password")
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

func (sv *usersService) UpdateUser(data entities.UpdateUserModel) (*entities.UserDataModel, error) {
	return sv.UsersRepository.UpdateUser(data)
}

func (sv *usersService) DeleteUser(userID string) error {
	if _, err := sv.UsersRepository.FindByID(userID); err != nil {
		return err
	}

	return sv.UsersRepository.DeleteUser(userID)
}
