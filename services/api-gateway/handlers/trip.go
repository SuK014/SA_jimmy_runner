package handlers

import (
	"context"
	"io"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"
	userPb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreateTrip(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}

	bodyData := entities.CreatedTripModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	pinRes, err := h.planClient.CreatePin(context.Background(), &pb.CreatePinRequest{})
	if err != nil || !pinRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create default pin: " + err.Error()},
		)
	}

	whiteboardReq := &pb.CreateWhiteboardRequest{
		Pin: pinRes.PinId,
		Day: 1,
	}
	whiteboardRes, err := h.planClient.CreateWhiteboard(context.Background(), whiteboardReq)
	if err != nil || !whiteboardRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create whiteboard: " + err.Error()},
		)
	}

	tripReq := &pb.CreateTripRequest{
		Name:        bodyData.Name,
		Description: bodyData.Description,
		Whiteboards: []string{whiteboardRes.GetWhiteboardId()},
	}
	tripRes, err := h.planClient.CreateTrip(context.Background(), tripReq)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create trip: " + err.Error()},
		)
	}

	userTripReq := &userPb.UsersTripRequest{
		UserIds: []string{token.UserID},
		TripId:  tripRes.GetTripId(),
	}
	if _, err = h.userClient.CreateUsersTrip(context.Background(), userTripReq); err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(tripRes)
}

func (h *HTTPHandler) GetTripByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}
	tripReq := &pb.TripIDRequest{
		TripId: id,
	}
	tripRes, err := h.planClient.GetTripByID(context.Background(), tripReq)
	if err != nil || !tripRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get trip by id: " + err.Error()},
		)
	}

	whiteboardReq := &pb.ManyWhiteboardIDRequest{
		Whiteboards: tripRes.Whiteboards,
	}
	whiteboardRes, err := h.planClient.GetWhiteboardsByTrip(context.Background(), whiteboardReq)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get whiteboard by trip: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseModel{
			Message: "success",
			Data: fiber.Map{
				"trip":        tripRes,
				"whiteboards": whiteboardRes,
			},
			Status: fiber.StatusOK,
		},
	)
}

func (h *HTTPHandler) UpdateTripByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	bodyData := entities.UpdatedTripModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	req := &pb.UpdateTripRequest{
		Id:                   id,
		Name:                 bodyData.Name,
		Description:          bodyData.Description,
		Whiteboards:          bodyData.Whiteboards,
		WhiteboardChangeType: bodyData.WhiteboardsChangeType,
	}

	res, err := h.planClient.UpdateTrip(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update trip: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) UpdateTripImageByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	fileHeader, err := ctx.FormFile("image")
	var imageBytes []byte

	if err == nil && fileHeader != nil {
		file, err := fileHeader.Open()
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				entities.ResponseMessage{Message: "failed to open uploaded file"},
			)
		}
		defer file.Close()

		imageBytes, err = io.ReadAll(file)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(
				entities.ResponseMessage{Message: "failed to read uploaded file"},
			)
		}
	}

	req := &pb.UpdateTripImageRequest{
		Id:    id,
		Image: imageBytes,
	}

	res, err := h.planClient.UpdateTripImage(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update trip image: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) DeleteTripByID(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}
	userTripReq := &userPb.UserTripRequest{
		UserId: token.UserID,
		TripId: id,
	}
	if res, err := h.userClient.CheckAuthUserTrip(context.Background(), userTripReq); err != nil || !res.GetSuccess() {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "don't have access to trip."})
	}

	getWhiteboardIDReq := &pb.TripIDRequest{
		TripId: id,
	}
	getWhiteboardIDRes, err := h.planClient.GetTripByID(context.Background(), getWhiteboardIDReq)
	if err != nil || !getWhiteboardIDRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot GetTripByID: " + err.Error()},
		)
	}

	deleteWhiteboardReq := &pb.ManyWhiteboardIDRequest{
		Whiteboards: getWhiteboardIDRes.Whiteboards,
	}
	deleteWhiteboardRes, err := h.planClient.DeleteWhiteboardByTrip(context.Background(), deleteWhiteboardReq)
	if err != nil || !deleteWhiteboardRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot DeleteWhiteboardByTrip: " + err.Error()},
		)
	}

	req := &pb.TripIDRequest{
		TripId: id,
	}
	res, err := h.planClient.DeleteTripByID(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot DeleteTripByID: " + err.Error()},
		)
	}

	if res, err := h.userClient.DeleteByTrip(context.Background(), userTripReq); err != nil || !res.GetSuccess() {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "don't have access to trip."})
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
