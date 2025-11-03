package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"google.golang.org/grpc"
)

type gRPCHandler struct {
	pb.UnimplementedUserServiceServer
	userService     services.IUsersService
	userTripService services.IUserTripService
}

func NewGRPCHandler(server *grpc.Server, userService services.IUsersService, userTripService services.IUserTripService) (*gRPCHandler, error) {
	handler := &gRPCHandler{
		userService:     userService,
		userTripService: userTripService,
	}
	pb.RegisterUserServiceServer(server, handler)
	return handler, nil
}
