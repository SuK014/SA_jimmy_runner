package handlers

import (
	"context"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreateUser(ctx *fiber.Ctx) error {
	bodyData := entities.CreatedUserModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	if bodyData.Email == "" || bodyData.Password == "" {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "email and password are required"},
		)
	}

	req := &pb.CreateUserRequest{
		Email:       bodyData.Email,
		DisplayName: bodyData.Name,
		Password:    bodyData.Password,
	}

	_, err := h.Client.CreateUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseMessage{Message: "success"},
	)
}
