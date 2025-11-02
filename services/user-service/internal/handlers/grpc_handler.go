package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"context"

	"github.com/SuK014/SA_jimmy_runner/shared/utils"
	"google.golang.org/grpc"
)

type gRPCHandler struct {
	pb.UnimplementedUserServiceServer
	service services.IUsersService
}

func NewGRPCHandler(server *grpc.Server, service services.IUsersService) (*gRPCHandler, error) {
	handler := &gRPCHandler{
		service: service,
	}
	pb.RegisterUserServiceServer(server, handler)
	return handler, nil
}

func (h *gRPCHandler) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {

	user := entities.CreatedUserModel{
		Name:     req.GetDisplayName(),
		Email:    req.GetEmail(),
		Password: req.GetPassword(),
	}

	res, err := h.service.InsertNewUser(user)
	if err != nil {
		return nil, err
	}

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

	res, err := h.service.Login(user)
	if err != nil {
		return nil, err
	}

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
	publicURL, err := utils.UploadToSupabase(
		profile.GetFileData(),
		profile.GetFilename(),
		profile.GetContentType(),
		user_id,
	)
	if err != nil {
		return nil, err
	}

	user := entities.UpdateUserModel{
		ID:      user_id,
		Name:    req.GetName(),
		Profile: publicURL,
	}

	res, err := h.service.UpdateUser(user)
	if err != nil {
		return nil, err
	}

	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) GetUser(ctx context.Context, req *pb.UserIDRequest) (*pb.UserResponse, error) {

	res, err := h.service.GetByID(req.GetUserId())
	if err != nil {
		return nil, err
	}

	return &pb.UserResponse{
		Success:     true,
		UserId:      res.UserID,
		DisplayName: res.Name,
		Email:       res.Email,
		Profile:     res.Profile,
	}, nil
}

func (h *gRPCHandler) GetUsersAvatar(ctx context.Context, req *pb.UsersAvatarRequest) (*pb.UsersAvatarResponse, error) {

	res, err := h.service.GetAvatars(req.GetTripId(), req.GetUserId())
	if err != nil {
		return nil, err
	}

	var results []*pb.Avatar
	for _, r := range *res {
		results = append(results, &pb.Avatar{
			UserId:      r.ID,
			DisplayName: r.Name,
			Profile:     r.Profile,
		})
	}

	return &pb.UsersAvatarResponse{
		Success: true,
		Users:   results,
	}, nil
}

func (h *gRPCHandler) DeleteUser(ctx context.Context, req *pb.UserIDRequest) (*pb.UserResponse, error) {

	err := h.service.DeleteUser(req.GetUserId())
	if err != nil {
		return nil, err
	}

	return &pb.UserResponse{
		Success: true,
	}, nil
}
