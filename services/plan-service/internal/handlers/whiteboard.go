package handlers

import (
	"fmt"

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
		fmt.Println("CreateWhiteboard at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("CreateWhiteboard at plan-service success")
	return &pb.CreateWhiteboardResponse{
		Success:      true,
		WhiteboardId: res,
	}, nil
}

func (h *gRPCHandler) GetWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.GetWhiteboardByIDResponse, error) {

	res, err := h.WhiteboardService.FindByID(req.GetWhiteboardId())
	if err != nil {
		fmt.Println("GetWhiteboardByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("GetWhiteboardByID at plan-service success")
	return &pb.GetWhiteboardByIDResponse{
		Success: true,
		Pins:    res.Pins,
		Day:     int32(res.Day),
	}, nil
}

func (h *gRPCHandler) GetWhiteboardsByTrip(ctx context.Context, req *pb.ManyWhiteboardIDRequest) (*pb.GetWhiteboardsResponse, error) {

	whiteboardRes, err := h.WhiteboardService.FindManyByID(req.GetWhiteboards())
	if err != nil {
		fmt.Println("GetWhiteboardsByTrip -> FindManyWhiteboardsByID at plan-service failed:", err.Error())
		return nil, err
	}

	var whiteboards []*pb.GetWhiteboardResponse
	for _, whiteboardData := range *whiteboardRes {
		pinRes, err := h.PinService.FindManyByID(whiteboardData.Pins)
		if err != nil {
			fmt.Println("GetWhiteboardsByTrip -> FindManyPinsByID at plan-service failed:", err.Error())
			return nil, err
		}

		var pins []*pb.GetPinResponse
		for _, pinData := range *pinRes {
			pins = append(pins, &pb.GetPinResponse{
				Name:        pinData.Name,
				PinId:       pinData.PinID,
				Image:       pinData.Image,
				Parents:     pinData.Parents,
				Participant: pinData.Participants,
			})
		}
		whiteboards = append(whiteboards, &pb.GetWhiteboardResponse{
			Day:  int32(whiteboardData.Day),
			Pins: pins,
		})
	}

	fmt.Println("GetWhiteboardsByTrip at plan-service success")
	return &pb.GetWhiteboardsResponse{
		Whiteboards: whiteboards,
	}, nil
}

func (h *gRPCHandler) UpdateWhiteboard(ctx context.Context, req *pb.UpdateWhiteboardRequest) (*pb.SuccessResponse, error) {
	whiteboard := entities.UpdatedWhiteboardModel{
		Pins:           req.GetPins(),
		PinsChangeType: req.GetPinChangeType(),
		Day:            int(req.GetDay()),
	}

	if err := h.WhiteboardService.UpdateWhiteboard(req.GetId(), whiteboard); err != nil {
		fmt.Println("UpdateWhiteboard at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("UpdateWhiteboard at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.SuccessResponse, error) {
	if err := h.WhiteboardService.DeleteWhiteboardByID(req.GetWhiteboardId()); err != nil {
		fmt.Println("DeleteWhiteboardByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteWhiteboardByID at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}

func (h *gRPCHandler) DeleteWhiteboardByTrip(ctx context.Context, req *pb.ManyWhiteboardIDRequest) (*pb.SuccessResponse, error) {

	whiteboardRes, err := h.WhiteboardService.FindManyByID(req.GetWhiteboards())
	if err != nil {
		fmt.Println("DeleteWhiteboardByTrip -> FindManyWhiteboardsByID at plan-service failed:", err.Error())
		return nil, err
	}

	// delete many pinID for each whiteboard
	for _, whiteboardData := range *whiteboardRes {
		if err := h.PinService.DeleteManyByID(whiteboardData.Pins); err != nil {
			fmt.Println("DeleteWhiteboardByTrip -> DeleteManyPinsByID at plan-service failed:", err.Error())
			return nil, err
		}
	}

	// delete many whiteboard
	if err := h.WhiteboardService.DeleteManyByID(req.GetWhiteboards()); err != nil {
		fmt.Println("DeleteWhiteboardByTrip -> DeleteManyWhiteboardsByID at plan-service failed:", err.Error())
		return nil, err
	}

	fmt.Println("DeleteWhiteboardByTrip at plan-service success")
	return &pb.SuccessResponse{
		Success: true,
	}, nil
}
