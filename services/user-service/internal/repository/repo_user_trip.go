package repository

import (
	"context"

	ds "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/prisma/db"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"

	"fmt"
)

type userTripRepository struct {
	Context    context.Context
	Collection *db.PrismaClient
}

type IUserTripRepository interface {
	Insert(tripID, userID, name string) (*entities.UserTripModel, error)
	FindByID(tripID, userID string) (*entities.UserTripModel, error)
	FindManyByID(tripID string, userID []string) (*[]entities.UserTripModel, error)
	Update(tripID, userID, name string) (*entities.UserTripModel, error)
	Delete(tripID, userID string) error
}

func NewUserTripRepository(db *ds.PrismaDB) IUserTripRepository {
	return &userTripRepository{
		Context:    db.Context,
		Collection: db.PrismaDB,
	}
}

func (repo *userTripRepository) Insert(tripID, userID, name string) (*entities.UserTripModel, error) {
	createdData, err := repo.Collection.UserTrip.CreateOne(
		db.UserTrip.TripID.Set(tripID),
		db.UserTrip.User.Link(db.User.UserID.Equals(userID)),
		db.UserTrip.Username.Set(name),
	).Exec(repo.Context)

	if err != nil {
		return nil, fmt.Errorf("users -> InsertUser: %v", err)
	}

	return mapToUserTripModel(createdData)
}

func (repo *userTripRepository) FindByID(tripID, userID string) (*entities.UserTripModel, error) {
	user, err := repo.Collection.UserTrip.FindUnique(
		db.UserTrip.UserTripUserIDTripIDKey(
			db.UserTrip.UserID.Equals(userID),
			db.UserTrip.TripID.Equals(tripID),
		),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindByID: %v", err)
	}
	if user == nil {
		return nil, fmt.Errorf("users -> FindByID: user data is nil")
	}

	return mapToUserTripModel(user)
}

func (repo *userTripRepository) FindManyByID(tripID string, userID []string) (*[]entities.UserTripModel, error) {
	users, err := repo.Collection.UserTrip.FindMany(
		db.UserTrip.TripID.Equals(tripID),
		db.UserTrip.UserID.In(userID),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> FindByID: %v", err)
	}
	if users == nil {
		return nil, fmt.Errorf("users -> FindByID: user data is nil")
	}

	var results []entities.UserTripModel
	for _, u := range users {
		result, err := mapToUserTripModel(&u)
		if err != nil {
			return nil, err
		}
		results = append(results, *result)
	}

	return &results, nil
}

func (repo *userTripRepository) Update(tripID, userID, name string) (*entities.UserTripModel, error) {
	updatedUser, err := repo.Collection.UserTrip.FindUnique(
		db.UserTrip.UserTripUserIDTripIDKey(
			db.UserTrip.UserID.Equals(userID),
			db.UserTrip.TripID.Equals(tripID),
		),
	).Update(
		db.UserTrip.Username.Set(name),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("users -> UpdateUser: %v", err)
	}

	return mapToUserTripModel(updatedUser)
}

func (repo *userTripRepository) Delete(tripID, userID string) error {
	_, err := repo.Collection.UserTrip.FindUnique(
		db.UserTrip.UserTripUserIDTripIDKey(
			db.UserTrip.UserID.Equals(userID),
			db.UserTrip.TripID.Equals(tripID),
		),
	).Delete().Exec(repo.Context)
	if err != nil {
		return fmt.Errorf("users -> DeleteUser: %v", err)
	}
	return nil
}

func mapToUserTripModel(data *db.UserTripModel) (*entities.UserTripModel, error) {
	name, _ := data.Username()
	return &entities.UserTripModel{
		UserID: data.UserID,
		TripID: data.TripID,
		Name:   name,
	}, nil
}
