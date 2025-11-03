package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/service"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"google.golang.org/grpc"
)

type gRPCHandler struct {
	pb.UnimplementedPlansServiceServer
	PinService        services.IPinsService
	WhiteboardService services.IWhiteboardsService
}

func NewGRPCHandler(server *grpc.Server, pinService services.IPinsService, whiteboardService services.IWhiteboardsService) (*gRPCHandler, error) {
	handler := &gRPCHandler{
		PinService:        pinService,
		WhiteboardService: whiteboardService,
	}
	pb.RegisterPlansServiceServer(server, handler)
	return handler, nil
}
