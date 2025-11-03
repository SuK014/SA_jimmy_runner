package handlers

import (
	"context"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"github.com/gofiber/fiber/v2"
)

func (h *HTTPHandler) GetParticipantsByPinID(ctx *fiber.Ctx) error {
	_, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}
	bodyData := entities.AvatarResponse{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	req := &pb.UsersAvatarRequest{
		TripId: bodyData.TripID,
		UserId: bodyData.UserID,
	}

	res, err := h.userClient.GetUsersAvatar(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get user Avatar (userTrip + user): " + err.Error()},
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
