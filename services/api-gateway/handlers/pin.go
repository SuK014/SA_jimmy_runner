package handlers

import (
	"context"
	"io"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreatePin(ctx *fiber.Ctx) error {
	whiteboardID := ctx.Query("whiteboard_id")
	if whiteboardID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'whiteboard_id' query parameter"},
		)
	}
	bodyData := entities.CreatedPinModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	expenses := []*pb.Expenses{}
	for _, e := range bodyData.Expenses {
		expenses = append(expenses, &pb.Expenses{
			Id:      e.ID,
			Name:    e.Name,
			Expense: e.Expense,
		})
	}

	req := &pb.CreatePinRequest{
		Name:        bodyData.Name,
		Description: bodyData.Description,
		Expense:     expenses,
		Location:    bodyData.Location,
		Parents:     bodyData.Parents,
		Participant: bodyData.Participants,
	}

	res, err := h.planClient.CreatePin(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create new pin: " + err.Error()},
		)
	}

	whiteboardReq := &pb.UpdateWhiteboardRequest{
		Id:            whiteboardID,
		Pins:          []string{res.GetPinId()},
		PinChangeType: "add",
	}
	if _, err = h.planClient.UpdateWhiteboard(context.Background(), whiteboardReq); err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot auto update whiteboard(add pin): " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) GetPinByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	req := &pb.PinIDRequest{
		PinId: id,
	}

	res, err := h.planClient.GetPinByID(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get pin by id: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseModel{
			Message: "success",
			Data:    res,
			Status:  fiber.StatusOK,
		},
	)
}

func (h *HTTPHandler) GetPinByParticipant(ctx *fiber.Ctx) error {
	tokenDetail, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}
	user_id := tokenDetail.UserID

	req := &pb.GetPinByParticipantRequest{
		UserId: user_id,
	}

	res, err := h.planClient.GetPinByParticipant(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get pin by participants: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseModel{
			Message: "success",
			Data:    res,
			Status:  fiber.StatusOK,
		},
	)
}

func (h *HTTPHandler) UpdatePinByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	bodyData := entities.UpdatedPinModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	expenses := []*pb.Expenses{}
	for _, e := range bodyData.Expenses {
		expenses = append(expenses, &pb.Expenses{
			Id:      e.ID,
			Name:    e.Name,
			Expense: e.Expense,
		})
	}

	req := &pb.UpdatePinRequest{
		Id:          id,
		Name:        bodyData.Name,
		Description: bodyData.Description,
		Expense:     expenses,
		Location:    bodyData.Location,
		Parents:     bodyData.Parents,
		Participant: bodyData.Participants,
	}

	res, err := h.planClient.UpdatePin(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update pin: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) UpdatePinImageByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	fileHeader, err := ctx.FormFile("image")
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or invalid 'image' file in form data"},
		)
	}

	if fileHeader == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "no file provided"},
		)
	}

	file, err := fileHeader.Open()
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "failed to open uploaded file"},
		)
	}
	defer file.Close()

	imageBytes, err := io.ReadAll(file)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "failed to read uploaded file"},
		)
	}

	if len(imageBytes) == 0 {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "uploaded file is empty"},
		)
	}

	req := &pb.UpdatePinImageRequest{
		Id:    id,
		Image: imageBytes,
	}

	res, err := h.planClient.UpdatePinImage(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update pin image: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
func (h *HTTPHandler) DeletePinByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}
	whiteboardID := ctx.Query("whiteboard_id")
	if whiteboardID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'whiteboard_id' query parameter"},
		)
	}

	req := &pb.PinIDRequest{
		PinId: id,
	}

	res, err := h.planClient.DeletePinByID(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot delete pin by id: " + err.Error()},
		)
	}

	whiteboardReq := &pb.UpdateWhiteboardRequest{
		Id:            whiteboardID,
		Pins:          []string{id},
		PinChangeType: "remove",
	}
	if _, err = h.planClient.UpdateWhiteboard(context.Background(), whiteboardReq); err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot auto update whiteboard(remove pin): " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
