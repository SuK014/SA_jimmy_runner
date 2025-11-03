package handlers

import (
	"context"
	"fmt"
	"io"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreatePin(ctx *fiber.Ctx) error {
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
		Participant: bodyData.Participants,
	}

	res, err := h.planClient.CreatePin(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
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

	req := &pb.GetPinByIDRequest{
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
		return fmt.Errorf("failed to generate token: %w", err)
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

	req := &pb.UpdatePinImageRequest{
		Id:    id,
		Image: imageBytes,
	}

	res, err := h.planClient.UpdatePinImage(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update pin: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
