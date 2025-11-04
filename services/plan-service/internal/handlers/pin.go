package handlers

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"context"
)

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
		Parents:      req.GetParents(),
		Participants: req.GetParticipant(),
	}

	res, err := h.PinService.InsertPin(pin)
	if err != nil {
		fmt.Println("CreatePin at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CreatePin at plan-service success")
	return &pb.CreatePinResponse{
		Success: true,
		PinId:   res,
	}, nil
}

func (h *gRPCHandler) GetPinByID(ctx context.Context, req *pb.PinIDRequest) (*pb.GetPinByIDResponse, error) {
	pin := req.PinId

	res, err := h.PinService.FindByID(pin)
	if err != nil {
		fmt.Println("GetPinByID at plan-service failed:", err.Error())
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

	fmt.Println("GetPinByID at plan-service success")
	return &pb.GetPinByIDResponse{
		Success:     true,
		Name:        res.Name,
		Image:       res.Image,
		Description: res.Description,
		Expense:     expenses,
		Location:    res.Location,
		Parents:     res.Parents,
		Participant: res.Participants,
	}, nil
}

func (h *gRPCHandler) GetPinByParticipant(ctx context.Context, req *pb.GetPinByParticipantRequest) (*pb.GetPinsResponse, error) {

	pin := req.UserId

	res, err := h.PinService.FindByParticipant(pin)
	if err != nil {
		fmt.Println("GetPinByParticipant at plan-service failed:", err.Error())
		return nil, err
	}

	var pins []*pb.GetPinResponse
	for _, pinData := range *res {
		pins = append(pins, &pb.GetPinResponse{
			Name:        pinData.Name,
			PinId:       pinData.PinID,
			Image:       pinData.Image,
			Parents:     pinData.Parents,
			Participant: pinData.Participants,
		})
	}

	fmt.Println("GetPinByParticipant at plan-service success")
	return &pb.GetPinsResponse{
		Pins: pins,
	}, nil
}

func (h *gRPCHandler) GetPinsByWhiteboard(ctx context.Context, req *pb.ManyPinIDRequest) (*pb.GetPinsResponse, error) {

	res, err := h.PinService.FindManyByID(req.GetPins())
	if err != nil {
		fmt.Println("GetPinsByWhiteboard at plan-service failed:", err.Error())
		return nil, err
	}

	var pins []*pb.GetPinResponse
	for _, pinData := range *res {
		pins = append(pins, &pb.GetPinResponse{
			Name:        pinData.Name,
			PinId:       pinData.PinID,
			Image:       pinData.Image,
			Parents:     pinData.Parents,
			Participant: pinData.Participants,
		})
	}

	fmt.Println("GetPinsByWhiteboard at plan-service success")
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
		Parents:      req.GetParents(),
		Participants: req.GetParticipant(),
	}

	if err := h.PinService.UpdatePin(req.GetId(), pin); err != nil {
		fmt.Println("UpdatePin at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdatePin at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) UpdatePinImage(ctx context.Context, req *pb.UpdatePinImageRequest) (*pb.SuccessResponse, error) {

	if err := h.PinService.UpdatePinImage(req.GetId(), req.GetImage()); err != nil {
		fmt.Println("UpdatePinImage at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdatePinImage at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeletePinByID(ctx context.Context, req *pb.PinIDRequest) (*pb.SuccessResponse, error) {
	if err := h.PinService.DeletePinByID(req.GetPinId()); err != nil {
		fmt.Println("DeletePinByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeletePinByID at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeletePinByWhiteboard(ctx context.Context, req *pb.ManyPinIDRequest) (*pb.SuccessResponse, error) {
	if err := h.PinService.DeleteManyByID(req.GetPins()); err != nil {
		fmt.Println("DeletePinByWhiteboard at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeletePinByWhiteboard at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
