package handlers

import (
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"context"
)

func (h *gRPCHandler) CreateTrip(ctx context.Context, req *pb.CreateTripRequest) (*pb.CreateTripResponse, error) {

	trip := entities.CreatedTripModel{
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Whiteboards: []string{req.GetDescription()},
	}

	res, err := h.TripService.InsertTrip(trip)
	if err != nil {
		return nil, err
	}

	return &pb.CreateTripResponse{
		Success: true,
		TripId:  res,
	}, nil
}

func (h *gRPCHandler) GetTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.GetTripByIDResponse, error) {

	res, err := h.TripService.FindByID(req.GetTripId())
	if err != nil {
		return nil, err
	}

	return &pb.GetTripByIDResponse{
		Success:     true,
		Name:        res.Name,
		Description: res.Description,
		Image:       res.Image,
		Whiteboards: res.Whiteboards,
	}, nil
}

func (h *gRPCHandler) UpdateTrip(ctx context.Context, req *pb.UpdateTripRequest) (*pb.SuccessResponse, error) {
	trip := entities.UpdatedTripModel{
		Name:                  req.GetName(),
		Description:           req.GetDescription(),
		Whiteboards:           req.GetWhiteboards(),
		WhiteboardsChangeType: req.GetWhiteboardChangeType(),
	}

	if err := h.TripService.UpdateTrip(req.GetId(), trip); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) UpdateTripImage(ctx context.Context, req *pb.UpdateTripImageRequest) (*pb.SuccessResponse, error) {

	if err := h.TripService.UpdateTripImage(req.GetId(), req.GetImage()); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.SuccessResponse, error) {
	if err := h.TripService.DeleteTripByID(req.GetTripId()); err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
