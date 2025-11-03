package handlers

import (
	"context"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) AddUsersToTrip(ctx *fiber.Ctx) error {
	_, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}
	bodyData := entities.UsersTripModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	req := &pb.UsersTripRequest{
		UserIds: bodyData.UserID,
		TripId:  bodyData.TripID,
	}

	res, err := h.userClient.CreateUsersTrip(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) GetTripsByUserID(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}

	req := &pb.UserIDRequest{
		UserId: token.UserID,
	}

	res, err := h.userClient.GetAllTripsByUserID(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get user: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
