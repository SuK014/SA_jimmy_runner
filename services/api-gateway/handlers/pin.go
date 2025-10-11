package handlers

import (
	"context"
	"fmt"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreatePin(ctx *fiber.Ctx) error {
	bodyData := entities.CreatedPinGRPCModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	req := &pb.CreatePinRequest{
		Image:       bodyData.Image,
		Description: bodyData.Description,
		Expense:     bodyData.Expense,
		Location:    bodyData.Location,
		Participant: bodyData.Participants,
	}

	res, err := h.planClient.CreatePin(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
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
