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
	InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error)
	FindByID(tripID, userID string) (*entities.UserTripModel, error)
	FindManyUsersByTripID(tripID string) (*[]entities.UserTripModel, error)
	FindManyTripsByUserID(userID string) (*entities.UserTripsModel, error)
	Update(tripID, userID, name string) (*entities.UserTripModel, error)
	DeleteByID(tripID, userID string) error
	DeleteByUserID(userID string) error
	DeleteByTripID(tripID string) error
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
		return nil, fmt.Errorf("usersTrips -> Insert new UserTrip: %v", err)
	}

	return mapToUserTripModel(createdData)
}

func (repo *userTripRepository) InsertManyUsers(tripID string, userIDs []string) (*entities.UsersTripModel, error) {
	var user_ids []string
	for _, userID := range userIDs {
		createdData, err := repo.Collection.UserTrip.CreateOne(
			db.UserTrip.TripID.Set(tripID),
			db.UserTrip.User.Link(db.User.UserID.Equals(userID)),
			db.UserTrip.Username.Set(""), // or get username from repo if needed
		).Exec(repo.Context)

		if err != nil {
			return nil, fmt.Errorf("usersTrips -> failed to insert UserTrip for user %s: %v", userID, err)
		}

		user_ids = append(user_ids, createdData.UserID)
	}

	return &entities.UsersTripModel{
		UserID: user_ids,
		TripID: tripID,
		Name:   "",
	}, nil
}

func (repo *userTripRepository) FindByID(tripID, userID string) (*entities.UserTripModel, error) {
	user, err := repo.Collection.UserTrip.FindUnique(
		db.UserTrip.UserTripUserIDTripIDKey(
			db.UserTrip.UserID.Equals(userID),
			db.UserTrip.TripID.Equals(tripID),
		),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("usersTrips -> FindByID: %v", err)
	}
	if user == nil {
		return nil, fmt.Errorf("usersTrips -> FindByID: userTrip data is nil")
	}

	return mapToUserTripModel(user)
}

func (repo *userTripRepository) FindManyUsersByTripID(tripID string) (*[]entities.UserTripModel, error) {
	users, err := repo.Collection.UserTrip.FindMany(
		db.UserTrip.TripID.Equals(tripID),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("usersTrips -> FindManyUsersByTripID: %v", err)
	}
	if users == nil {
		return nil, fmt.Errorf("usersTrips -> FindManyUsersByTripID: userTrip data is nil")
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

func (repo *userTripRepository) FindManyTripsByUserID(userID string) (*entities.UserTripsModel, error) {
	trips, err := repo.Collection.UserTrip.FindMany(
		db.UserTrip.UserID.Equals(userID),
	).Exec(repo.Context)
	if err != nil {
		return nil, fmt.Errorf("usersTrips -> FindManyTripsByUserID: %v", err)
	}
	if trips == nil {
		return nil, fmt.Errorf("usersTrips -> FindManyTripsByUserID: userTrip data is nil")
	}

	var trip_ids []string
	for _, u := range trips {
		trip_ids = append(trip_ids, u.TripID)
	}

	return &entities.UserTripsModel{
		UserID: userID,
		TripID: trip_ids,
	}, nil
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
		return nil, fmt.Errorf("usersTrips -> UpdateUserTrip: %v", err)
	}

	return mapToUserTripModel(updatedUser)
}

func (repo *userTripRepository) DeleteByID(tripID, userID string) error {
	_, err := repo.Collection.UserTrip.FindUnique(
		db.UserTrip.UserTripUserIDTripIDKey(
			db.UserTrip.UserID.Equals(userID),
			db.UserTrip.TripID.Equals(tripID),
		),
	).Delete().Exec(repo.Context)

	if err != nil {
		return fmt.Errorf("usersTrips -> DeleteByID (tripID: %s, userID: %s): %v", tripID, userID, err)
	}
	return nil
}

func (repo *userTripRepository) DeleteByUserID(userID string) error {
	_, err := repo.Collection.UserTrip.FindMany(
		db.UserTrip.UserID.Equals(userID),
	).Delete().Exec(repo.Context)

	if err != nil {
		return fmt.Errorf("usersTrips -> DeleteByUserID (%s): %v", userID, err)
	}
	return nil
}

func (repo *userTripRepository) DeleteByTripID(tripID string) error {
	_, err := repo.Collection.UserTrip.FindMany(
		db.UserTrip.TripID.Equals(tripID),
	).Delete().Exec(repo.Context)

	if err != nil {
		return fmt.Errorf("usersTrips -> DeleteByTripID (%s): %v", tripID, err)
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
