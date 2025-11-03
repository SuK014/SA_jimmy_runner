package handlers

import (
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"context"
)

func (h *gRPCHandler) CreateWhiteboard(ctx context.Context, req *pb.CreateWhiteboardRequest) (*pb.CreateWhiteboardResponse, error) {

	whiteboard := entities.CreatedWhiteboardModel{
		Pins: []string{req.GetPin()},
		Day:  int(req.GetDay()),
	}

	res, err := h.WhiteboardService.InsertWhiteboard(whiteboard)
	if err != nil {
		return nil, err
	}

	return &pb.CreateWhiteboardResponse{
		Success:      true,
		WhiteboardId: res,
	}, nil
}

func (h *gRPCHandler) GetWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.GetWhiteboardByIDResponse, error) {

	res, err := h.WhiteboardService.FindByID(req.GetWhiteboardId())
	if err != nil {
		return nil, err
	}

	return &pb.GetWhiteboardByIDResponse{
		Success: true,
		Pins:    res.Pins,
		Day:     int32(res.Day),
	}, nil
}

func (h *gRPCHandler) UpdateWhiteboard(ctx context.Context, req *pb.UpdateWhiteboardRequest) (*pb.SuccessResponse, error) {
	whiteboard := entities.UpdatedWhiteboardModel{
		Pins:           req.GetPins(),
		PinsChangeType: req.GetPinChangeType(),
		Day:            int(req.GetDay()),
	}

	if err := h.WhiteboardService.UpdateWhiteboard(req.GetId(), whiteboard); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.SuccessResponse, error) {
	if err := h.WhiteboardService.DeleteWhiteboardByID(req.GetWhiteboardId()); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
