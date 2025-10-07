package handlers

import (
	services "github.com/SuK014/SA_jimmy_runner/services/plan-service/internal/service"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"context"

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

func (h *gRPCHandler) CreateUser(ctx context.Context, req *pb.CreatePinRequest) (*pb.CreatePinResponse, error) {

	pin := entities.CreatedPinGRPCModel{
		Image:        req.GetImage(),
		Description:  req.GetDescription(),
		Expense:      req.GetExpense(),
		Location:     req.GetLocation(),
		Participants: req.GetParticipant(),
	}

	err := h.PinService.InsertPin(pin)
	if err != nil {
		return nil, err
	}

	return &pb.CreatePinResponse{Success: true}, nil
}
