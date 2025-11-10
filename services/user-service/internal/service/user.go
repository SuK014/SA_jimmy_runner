package service

import (
	"fmt"
	"net/mail"

	notiClient "github.com/SuK014/SA_jimmy_runner/services/user-service/grpc_clients/noti_client"
	repositories "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	"github.com/SuK014/SA_jimmy_runner/shared/utils"
)

type usersService struct {
	UsersRepository repositories.IUsersRepository
	NotiClient      *notiClient.NotiClient
}

type IUsersService interface {
	GetAllUsers() (*[]entities.UserDataModel, error)
	FindByEmail(email string) (*entities.UserDataModel, error)
	InsertNewUser(data entities.CreatedUserModel) (*entities.UserDataModel, error)
	GetByID(userID string) (*entities.UserDataModel, error)
	FindManyUsersByID(userID []string) (*[]entities.UserDataModel, error)
	Login(user entities.LoginUserModel) (*entities.UserDataModel, error)
	UpdateUser(data entities.UpdateUserModel) (*entities.UserDataModel, error)
	DeleteUser(userID string) error
}

func NewUsersService(repo0 repositories.IUsersRepository, notiClient *notiClient.NotiClient) IUsersService {
	return &usersService{
		UsersRepository: repo0,
		NotiClient:      notiClient,
	}
}

func (sv *usersService) GetAllUsers() (*[]entities.UserDataModel, error) {
	data, err := sv.UsersRepository.FindAll()
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *usersService) FindByEmail(email string) (*entities.UserDataModel, error) {
	return sv.UsersRepository.FindByEmail(email)
}

func (sv *usersService) GetByID(userID string) (*entities.UserDataModel, error) {
	data, err := sv.UsersRepository.FindByID(userID)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (sv *usersService) FindManyUsersByID(userID []string) (*[]entities.UserDataModel, error) {
	profileData, err := sv.UsersRepository.FindManyByID(userID)
	if err != nil {
		return nil, err
	}
	return profileData, nil
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
	fmt.Printf("🔵 InsertNewUser called for email: %s\n", data.Email)

	//check email format
	if _, err := mail.ParseAddress(data.Email); err != nil {
		fmt.Printf("❌ Invalid email format: %s\n", data.Email)
		return nil, err
	}

	// Insert user into database
	fmt.Println("🔵 Inserting user into database...")
	user, err := sv.UsersRepository.InsertUser(data)
	if err != nil {
		fmt.Printf("❌ Failed to insert user: %v\n", err)
		return nil, err
	}
	fmt.Printf("✅ User inserted successfully: %s (ID: %s)\n", user.Email, user.UserID)

	// Send welcome email notification
	fmt.Println("🔵 Calling sendWelcomeEmail...")
	go sv.sendWelcomeEmail(user)
	fmt.Println("🔵 done sendWelcomeEmail...")

	return user, nil
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

// sendWelcomeEmail sends email via gRPC to notification service
func (sv *usersService) sendWelcomeEmail(user *entities.UserDataModel) {
	if sv.NotiClient == nil {
		fmt.Println("⚠️  Warning: Notification client is not configured, skipping email notification")
		return
	}

	subject := "Welcome to SA Jimmy Runner! 🎉"
	body := fmt.Sprintf("Hi %s,\n\nThank you for registering with SA Jimmy Runner! We're excited to have you on board.\n\nBest regards,\nThe SA Jimmy Runner Team", user.Name)

	fmt.Printf("📤 Sending welcome email via gRPC for user: %s (email: %s)\n", user.Name, user.Email)

	if err := sv.NotiClient.SendEmail(user.Email, subject, body); err != nil {
		fmt.Printf("❌ Failed to send welcome email for user %s: %v\n", user.Email, err)
	} else {
		fmt.Printf("✅ Welcome email request sent successfully via gRPC for user: %s (email: %s)\n", user.Name, user.Email)
	}
}
