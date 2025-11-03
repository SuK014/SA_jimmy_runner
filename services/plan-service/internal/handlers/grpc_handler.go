package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/service"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"google.golang.org/grpc"
)

type gRPCHandler struct {
	pb.UnimplementedPlansServiceServer
	PinService services.IPinsService
}

func NewGRPCHandler(server *grpc.Server, pinService services.IPinsService) (*gRPCHandler, error) {
	handler := &gRPCHandler{
		PinService: pinService,
	}
	pb.RegisterPlansServiceServer(server, handler)
	return handler, nil
}
