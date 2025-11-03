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
	expense := req.GetExpense()
	var expenseEntities []entities.Expense
	for _, e := range expense {
		expenseEntities = append(expenseEntities, entities.Expense{
			ID:      e.GetId(),
			Name:    e.GetName(),
			Expense: e.GetExpense(),
		})
	}
	pin := entities.CreatedPinModel{
		Name:         req.GetName(),
		Description:  req.GetDescription(),
		Expenses:     expenseEntities,
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

	expenses := []*pb.Expenses{}
	for _, e := range res.Expenses {
		expenses = append(expenses, &pb.Expenses{
			Id:      e.ID,
			Name:    e.Name,
			Expense: e.Expense,
		})
	}

	return &pb.GetPinByIDResponse{
		Success:     true,
		Name:        res.Name,
		Image:       res.Image,
		Description: res.Description,
		Expense:     expenses,
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
			Name:        pinData.Name,
			PinId:       pinData.PinID,
			Image:       pinData.Image,
			Participant: pinData.Participants,
		})
	}

	return &pb.GetPinsResponse{
		Pins: pins,
	}, nil
}

func (h *gRPCHandler) UpdatePin(ctx context.Context, req *pb.UpdatePinRequest) (*pb.SuccessResponse, error) {
	expense := req.GetExpense()
	var expenseEntities []entities.Expense
	for _, e := range expense {
		expenseEntities = append(expenseEntities, entities.Expense{
			ID:      e.GetId(),
			Name:    e.GetName(),
			Expense: e.GetExpense(),
		})
	}
	pin := entities.UpdatedPinModel{
		Name:         req.GetName(),
		Description:  req.GetDescription(),
		Expenses:     expenseEntities,
		Location:     req.GetLocation(),
		Participants: req.GetParticipant(),
	}

	if err := h.PinService.UpdatePin(req.GetId(), pin); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) UpdatePinImage(ctx context.Context, req *pb.UpdatePinImageRequest) (*pb.SuccessResponse, error) {

	if err := h.PinService.UpdatePinImage(req.GetId(), req.GetImage()); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
