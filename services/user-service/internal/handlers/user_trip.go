package handlers

import (
	"fmt"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"context"
)

func (h *gRPCHandler) CreateUsersTrip(ctx context.Context, req *pb.UsersTripRequest) (*pb.UsersTripResponse, error) {

	res, err := h.userTripService.InsertManyUsers(req.GetTripId(), req.GetUserIds())
	if err != nil {
		fmt.Println("CreateUsersTrip at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CreateUsersTrip at user-service success")
	return &pb.UsersTripResponse{
		Success: true,
		UserIds: res.UserID,
		TripId:  res.TripID,
	}, nil
}

func (h *gRPCHandler) GetAllTripsByUserID(ctx context.Context, req *pb.UserIDRequest) (*pb.TripIDsResponse, error) {

	res, err := h.userTripService.FindManyTripsByUserID(req.GetUserId())
	if err != nil {
		fmt.Println("GetAllTripsByUserID at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("GetAllTripsByUserID at user-service success")
	return &pb.TripIDsResponse{
		Success: true,
		TripId:  res.TripID,
	}, nil
}

func (h *gRPCHandler) GetUsersAvatar(ctx context.Context, req *pb.UsersAvatarRequest) (*pb.UsersAvatarResponse, error) {
	userTripRes, err := h.userTripService.FindManyUsersByTripID(req.GetTripId())
	if err != nil {
		fmt.Println("GetUsersAvatar -> FindManyUsersByTripID at user-service failed:", err.Error())
		return nil, err
	}
	var user_ids []string
	for _, ut := range *userTripRes {
		fmt.Println(ut)
		user_ids = append(user_ids, ut.UserID)
	}
	if len(user_ids) == 0 {
		fmt.Println("GetUsersAvatar -> FindManyUsersByTripID at user-service failed: no users found for tripID")
		return nil, fmt.Errorf("no users found for tripID: %s", req.GetTripId())
	}
	userRes, err := h.userService.FindManyUsersByID(user_ids)
	if err != nil {
		fmt.Println("GetUsersAvatar -> FindManyUsersByID at user-service failed:", err.Error())
		return nil, err
	}
	fmt.Println("get profile")
	avatarRes, err := h.userTripService.MergeAvatar(userRes, userTripRes)
	if err != nil {
		fmt.Println("GetUsersAvatar -> MergeAvatar at user-service failed:", err.Error())
		return nil, err
	}

	avatars := []*pb.Avatar{}
	for _, a := range *avatarRes {
		avatars = append(avatars, &pb.Avatar{
			UserId:      a.ID,
			DisplayName: a.Name,
			Profile:     a.Profile,
		})
	}

	fmt.Println("GetUsersAvatar at user-service success")
	return &pb.UsersAvatarResponse{
		Success: true,
		Users:   avatars,
	}, nil
}

func (h *gRPCHandler) CheckAuthUserTrip(ctx context.Context, req *pb.UserTripRequest) (*pb.UserTripResponse, error) {

	res, err := h.userTripService.FindByID(req.GetTripId(), req.GetUserId())
	if err != nil {
		fmt.Println("CheckAuthUserTrip at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CheckAuthUserTrip at user-service success")
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
		fmt.Println("UpdateUsername at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdateUsername at user-service success")
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
		fmt.Println("Delete(DeleteByID) at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("Delete(DeleteByID) at user-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteByUser(ctx context.Context, req *pb.UserTripRequest) (*pb.SuccessResponse, error) {

	err := h.userTripService.DeleteByUserID(req.GetUserId())
	if err != nil {
		fmt.Println("DeleteByUser at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteByUser at user-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteByTrip(ctx context.Context, req *pb.UserTripRequest) (*pb.SuccessResponse, error) {

	err := h.userTripService.DeleteByTripID(req.GetTripId())
	if err != nil {
		fmt.Println("DeleteByTrip at user-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteByTrip at user-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
