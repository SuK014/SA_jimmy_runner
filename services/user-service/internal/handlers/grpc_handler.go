package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"context"

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

func (h *gRPCHandler) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {

	user := entities.CreatedUserModel{
		Name:     req.GetDisplayName(),
		Email:    req.GetEmail(),
		Password: req.GetPassword(),
	}

	_, err := h.service.InsertNewUser(user)
	if err != nil {
		return nil, err
	}

	return &pb.CreateUserResponse{Success: true}, nil
}
