package handlers

import (
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"context"
)

func (h *gRPCHandler) CreateTrip(ctx context.Context, req *pb.CreateTripRequest) (*pb.CreateTripResponse, error) {

	trip := entities.CreatedTripModel{
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Whiteboards: req.GetWhiteboards(),
	}

	res, err := h.TripService.InsertTrip(trip)
	if err != nil {
		fmt.Println("CreateTrip at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CreateTrip at plan-service success")
	return &pb.CreateTripResponse{
		Success: true,
		TripId:  res,
	}, nil
}

func (h *gRPCHandler) GetTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.GetTripByIDResponse, error) {

	res, err := h.TripService.FindByID(req.GetTripId())
	if err != nil {
		fmt.Println("GetTripByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("GetTripByID at plan-service success")
	return &pb.GetTripByIDResponse{
		Success:     true,
		Name:        res.Name,
		Description: res.Description,
		Image:       res.Image,
		Whiteboards: res.Whiteboards,
	}, nil
}

func (h *gRPCHandler) GetManyTripsByID(ctx context.Context, req *pb.ManyTripIDRequest) (*pb.GetTripsResponse, error) {

	res, err := h.TripService.FindManyByID(req.GetTrips())
	if err != nil {
		fmt.Println("GetManyTripsByID at plan-service failed:", err.Error())
		return nil, err
	}

	var trips []*pb.GetTripResponse
	for _, tripData := range *res {
		trips = append(trips, &pb.GetTripResponse{
			TripId:      tripData.TripID,
			Name:        tripData.Name,
			Description: tripData.Description,
			Image:       tripData.Image,
		})
	}

	fmt.Println("GetManyTripsByID at plan-service success")
	return &pb.GetTripsResponse{
		Trips: trips,
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
		fmt.Println("UpdateTrip at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdateTrip at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) UpdateTripImage(ctx context.Context, req *pb.UpdateTripImageRequest) (*pb.SuccessResponse, error) {

	if err := h.TripService.UpdateTripImage(req.GetId(), req.GetImage()); err != nil {
		fmt.Println("UpdateTripImage at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdateTripImage at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.SuccessResponse, error) {
	if err := h.TripService.DeleteTripByID(req.GetTripId()); err != nil {
		fmt.Println("DeleteTripByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteTripByID at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
