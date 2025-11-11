package handlers

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/SuK014/SA_jimmy_runner/services/api-gateway/middlewares"
	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"github.com/SuK014/SA_jimmy_runner/shared/utils"

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

	hashPassword, err := utils.HashPassword(bodyData.Password)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(
			entities.ResponseMessage{Message: "error hashing password: " + err.Error()},
		)
	}

	req := &pb.CreateUserRequest{
		Email:       bodyData.Email,
		DisplayName: bodyData.Name,
		Password:    hashPassword,
	}

	res, err := h.userClient.CreateUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot insert new user account: " + err.Error()},
		)
	}

	tokenDetail, err := middlewares.GenerateJWTToken(res.UserId)
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	//tmp: change config later
	ctx.Cookie(&fiber.Cookie{
		Name:     "cookies",
		Value:    *tokenDetail.Token,
		Expires:  time.Now().Add(24 * time.Hour), // expires in 1 day
		HTTPOnly: true,                           // not accessible via JavaScript
		Secure:   false,                          // set to true in production with HTTPS
		Path:     "/",
	})

	fmt.Println("set cookies success")

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) Login(ctx *fiber.Ctx) error {
	bodyData := entities.LoginUserModel{}
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

	req := &pb.LoginUserRequest{
		Email:    bodyData.Email,
		Password: bodyData.Password,
	}

	res, err := h.userClient.LoginUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot login: " + err.Error()},
		)
	}

	tokenDetail, err := middlewares.GenerateJWTToken(res.UserId)
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	//tmp: change config later
	ctx.Cookie(&fiber.Cookie{
		Name:     "cookies",
		Value:    *tokenDetail.Token,
		Expires:  time.Now().Add(24 * time.Hour), // expires in 1 day
		HTTPOnly: true,                           // not accessible via JavaScript
		Secure:   false,                          // set to true in production with HTTPS
		Path:     "/",
	})

	fmt.Println("set cookies success")

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) UpdateUser(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}

	fileHeader, err := ctx.FormFile("profile")
	if err != nil {
		fileHeader = nil
	}
	name := ctx.FormValue("name")

	req := &pb.UpdateUserRequest{
		UserId: token.UserID,
		Name:   name,
	}
	if fileHeader != nil {
		// Open the uploaded file
		f, err := fileHeader.Open()
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(entities.ResponseMessage{
				Message: "failed to open uploaded file",
			})
		}
		defer f.Close()

		// Read the file content
		fileBytes, err := io.ReadAll(f)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(entities.ResponseMessage{
				Message: "failed to read uploaded file",
			})
		}

		// Create the UploadFileRequest proto
		req.Profile = &pb.UploadFileRequest{
			Filename:    fileHeader.Filename,
			ContentType: fileHeader.Header.Get("Content-Type"),
			FileData:    fileBytes,
		}
	}

	res, err := h.userClient.UpdateUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update user: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) GetUser(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}

	req := &pb.UserIDRequest{
		UserId: token.UserID,
	}

	res, err := h.userClient.GetUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get user: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) DeleteUser(ctx *fiber.Ctx) error {
	token, err := middlewares.DecodeJWTToken(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "Unauthorization Token."})
	}

	req := &pb.UserIDRequest{
		UserId: token.UserID,
	}

	res, err := h.userClient.DeleteUser(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot delete user: " + err.Error()},
		)
	}

	userTripReq := &pb.UserTripRequest{
		UserId: token.UserID,
	}
	if res, err := h.userClient.DeleteByUser(context.Background(), userTripReq); err != nil || !res.GetSuccess() {
		return ctx.Status(fiber.StatusUnauthorized).JSON(entities.ResponseMessage{Message: "don't have access to trip."})
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
