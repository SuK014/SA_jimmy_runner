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

func (h *gRPCHandler) CreatePin(ctx context.Context, req *pb.CreatePinRequest) (*pb.CreatePinResponse, error) {

	pin := entities.CreatedPinGRPCModel{
		Image:        req.GetImage(),
		Description:  req.GetDescription(),
		Expense:      req.GetExpense(),
		Location:     req.GetLocation(),
		Participants: req.GetParticipant(),
	}

	res, err := h.PinService.InsertPin(pin)
	if err != nil {
		return nil, err
	}

	return &pb.CreatePinResponse{
		Success: true,
		PinId:   res,
	}, nil
}

func (h *gRPCHandler) GetPinByID(ctx context.Context, req *pb.GetPinByIDRequest) (*pb.GetPinByIDResponse, error) {
	pin := req.PinId

	res, err := h.PinService.FindByID(pin)
	if err != nil {
		return nil, err
	}

	return &pb.GetPinByIDResponse{
		Image:       res.Image,
		Description: res.Description,
		Expense:     res.Expense,
		Location:    res.Location,
		Participant: res.Participants,
	}, nil
}

func (h *gRPCHandler) GetPinByParticipant(ctx context.Context, req *pb.GetPinByParticipantRequest) (*pb.GetPinsResponse, error) {

	pin := req.UserId

	res, err := h.PinService.FindByParticipant(pin)
	if err != nil {
		return nil, err
	}

	var pins []*pb.GetPinResponse
	for _, pinData := range *res {
		pins = append(pins, &pb.GetPinResponse{
			PinId:       pinData.PinID,
			Image:       pinData.Image,
			Participant: pinData.Participants,
		})
	}

	return &pb.GetPinsResponse{
		Pins: pins,
	}, nil
}
