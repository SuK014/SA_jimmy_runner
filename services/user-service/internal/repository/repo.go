package repository

import (
	"context"

	ds "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/prisma/db"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"

	"fmt"
)

type usersRepository struct {
	Context    context.Context
	Collection *db.PrismaClient
}

type IUsersRepository interface {
	InsertUser(data entities.CreatedUserModel) (*entities.UserDataModel, error)
	FindAll() (*[]entities.UserDataModel, error)
	FindByID(userID string) (*entities.UserDataModel, error)
	FindManyByID(userID []string) (*[]entities.UserDataModel, error)
	FindByEmail(email string) (*entities.UserDataModel, error)
	UpdateUser(data entities.UpdateUserModel) (*entities.UserDataModel, error)
	DeleteUser(userID string) error
}

func NewUsersRepository(db *ds.PrismaDB) IUsersRepository {
	return &usersRepository{
		Context:    db.Context,
		Collection: db.PrismaDB,
	}
}

func (repo *usersRepository) InsertUser(data entities.CreatedUserModel) (*entities.UserDataModel, error) {
	createdData, err := repo.Collection.User.CreateOne(
		db.User.Name.Set(data.Name),
		db.User.Email.Set(data.Email),
		db.User.Password.Set(data.Password),
	).Exec(repo.Context)

	if err != nil {
		return nil, fmt.Errorf("users -> InsertUser: %v", err)
	}

	return mapToUserDataModel(createdData)
}

func (repo *usersRepository) FindAll() (*[]entities.UserDataModel, error) {
	users, err := repo.Collection.User.FindMany().Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindAll: %v", err)
	}

	var results []entities.UserDataModel
	for _, u := range users {
		result, err := mapToUserDataModel(&u)
		if err != nil {
			return nil, err
		}
		results = append(results, *result)
	}

	return &results, nil
}

func (repo *usersRepository) FindByID(userID string) (*entities.UserDataModel, error) {
	user, err := repo.Collection.User.FindUnique(
		db.User.UserID.Equals(userID),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindByID: %v", err)
	}
	if user == nil {
		return nil, fmt.Errorf("users -> FindByID: user data is nil")
	}

	return mapToUserDataModel(user)
}

func (repo *usersRepository) FindManyByID(userID []string) (*[]entities.UserDataModel, error) {
	users, err := repo.Collection.User.FindMany(
		db.User.UserID.In(userID),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindByID: %v", err)
	}
	if users == nil {
		return nil, fmt.Errorf("users -> FindByID: user data is nil")
	}

	var results []entities.UserDataModel
	for _, u := range users {
		result, err := mapToUserDataModel(&u)
		if err != nil {
			return nil, err
		}
		results = append(results, *result)
	}

	return &results, nil
}

func (repo *usersRepository) FindByEmail(email string) (*entities.UserDataModel, error) {
	user, err := repo.Collection.User.FindUnique(
		db.User.Email.Equals(email),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindByID: %v", err)
	}
	if user == nil {
		return nil, fmt.Errorf("users -> FindByID: user data is nil")
	}

	return mapToUserDataModel(user)
}

func (repo *usersRepository) UpdateUser(data entities.UpdateUserModel) (*entities.UserDataModel, error) {
	updatedUser, err := repo.Collection.User.
		FindUnique(db.User.UserID.Equals(data.ID)).
		Update(
			db.User.Name.Set(data.Name),
			db.User.ProfileURL.Set(data.Profile),
		).
		Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> UpdateUser: %v", err)
	}

	return mapToUserDataModel(updatedUser)
}

func (repo *usersRepository) DeleteUser(userID string) error {
	_, err := repo.Collection.User.
		FindUnique(db.User.UserID.Equals(userID)).
		Delete().
		Exec(repo.Context)
	if err != nil {
		return fmt.Errorf("users -> DeleteUser: %v", err)
	}
	return nil
}

func mapToUserDataModel(data *db.UserModel) (*entities.UserDataModel, error) {
	profileURL, _ := data.ProfileURL()
	return &entities.UserDataModel{
		UserID:    data.UserID,
		CreatedAt: data.CreatedAt,
		UpdatedAt: data.UpdatedAt,
		Name:      data.Name,
		Email:     data.Email,
		Password:  data.Password,
		Profile:   profileURL,
	}, nil
}
