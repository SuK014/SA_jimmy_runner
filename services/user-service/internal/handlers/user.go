package handlers

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"context"

	"github.com/SuK014/SA_jimmy_runner/shared/utils"
)

func (h *gRPCHandler) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {

	user := entities.CreatedUserModel{
		Name:     req.GetDisplayName(),
		Email:    req.GetEmail(),
		Password: req.GetPassword(),
	}

	res, err := h.userService.InsertNewUser(user)
	if err != nil {
		fmt.Println("CreateUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CreateUser at user-service success")
	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.UserResponse, error) {

	user := entities.LoginUserModel{
		Email:    req.GetEmail(),
		Password: req.GetPassword(),
	}

	res, err := h.userService.Login(user)
	if err != nil {
		fmt.Println("LoginUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("LoginUser at user-service success")
	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {

	profile := req.GetProfile()
	user_id := req.GetUserId()
	publicURL, err := utils.UploadToSupabaseProfile(
		profile.GetFileData(),
		profile.GetFilename(),
		profile.GetContentType(),
		user_id,
	)
	if err != nil {
		fmt.Println("UpdateUser -> UploadToSupabaseProfile at user-service failed:", err.Error())
		return nil, err
	}

	user := entities.UpdateUserModel{
		ID:      user_id,
		Name:    req.GetName(),
		Profile: publicURL,
	}

	res, err := h.userService.UpdateUser(user)
	if err != nil {
		fmt.Println("UpdateUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdateUser at user-service success")
	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) GetUser(ctx context.Context, req *pb.UserIDRequest) (*pb.UserResponse, error) {

	res, err := h.userService.GetByID(req.GetUserId())
	if err != nil {
		fmt.Println("GetUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("GetUser at user-service success")
	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) DeleteUser(ctx context.Context, req *pb.UserIDRequest) (*pb.UserResponse, error) {

	err := h.userService.DeleteUser(req.GetUserId())
	if err != nil {
		fmt.Println("DeleteUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteUser at user-service success")
	return &pb.UserResponse{
		Success: true,
	}, nil
}
