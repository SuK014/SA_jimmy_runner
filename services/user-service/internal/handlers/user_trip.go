package handlers

import (
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"context"
)

func (h *gRPCHandler) CreateUsersTrip(ctx context.Context, req *pb.UsersTripRequest) (*pb.UsersTripResponse, error) {

	res, err := h.userTripService.InsertManyUsers(req.GetTripId(), req.GetUserIds())
	if err != nil {
		return nil, err
	}

	return &pb.UsersTripResponse{
		Success: true,
		UserIds: res.UserID,
		TripId:  res.TripID,
	}, nil
}

func (h *gRPCHandler) GetAllTripsByUserID(ctx context.Context, req *pb.UserIDRequest) (*pb.TripIDsResponse, error) {

	res, err := h.userTripService.FindManyTripsByUserID(req.GetUserId())
	if err != nil {
		return nil, err
	}

	return &pb.TripIDsResponse{
		Success: true,
		TripId:  res.TripID,
	}, nil
}

func (h *gRPCHandler) CheckAuthUserTrip(ctx context.Context, req *pb.UserTripRequest) (*pb.UserTripResponse, error) {

	res, err := h.userTripService.FindByID(req.GetTripId(), req.GetUserId())
	if err != nil {
		return nil, err
	}

	return &pb.UserTripResponse{
		Success:  true,
		UserId:   res.UserID,
		TripId:   res.TripID,
		Username: res.Name,
	}, nil
}

func (h *gRPCHandler) UpdateUsername(ctx context.Context, req *pb.UserTripModel) (*pb.UserTripResponse, error) {

	res, err := h.userTripService.UpdateUsername(req.GetTripId(), req.GetUserId(), req.GetUsername())
	if err != nil {
		return nil, err
	}

	return &pb.UserTripResponse{
		Success:  true,
		UserId:   res.UserID,
		TripId:   res.TripID,
		Username: res.Name,
	}, nil
}

func (h *gRPCHandler) Delete(ctx context.Context, req *pb.UserTripRequest) (*pb.SuccessResponse, error) {

	err := h.userTripService.DeleteByID(req.GetUserId(), req.GetTripId())
	if err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteByUser(ctx context.Context, req *pb.UserTripRequest) (*pb.SuccessResponse, error) {

	err := h.userTripService.DeleteByUserID(req.GetUserId())
	if err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteByTrip(ctx context.Context, req *pb.UserTripRequest) (*pb.SuccessResponse, error) {

	err := h.userTripService.DeleteByTripID(req.GetTripId())
	if err != nil {
		return nil, err
	}

	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
