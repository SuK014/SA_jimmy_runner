package handlers

import (
	"context"
	"strconv"

	"github.com/SuK014/SA_jimmy_runner/shared/entities"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"

	"github.com/gofiber/fiber/v2"
)

// CreateUser handles REST requests and forwards them to gRPC
func (h *HTTPHandler) CreateWhiteboard(ctx *fiber.Ctx) error {
	day := ctx.Query("day")
	if day == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'day' query parameter"},
		)
	}
	dayInt, err := strconv.Atoi(day)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "cannot convert day to int: " + err.Error()},
		)
	}

	pinRes, err := h.planClient.CreatePin(context.Background(), &pb.CreatePinRequest{})
	if err != nil || !pinRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create default pin: " + err.Error()},
		)
	}

	req := &pb.CreateWhiteboardRequest{
		Pin: pinRes.PinId,
		Day: int32(dayInt),
	}

	res, err := h.planClient.CreateWhiteboard(context.Background(), req)
	if err != nil || !pinRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot create whiteboard: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) GetWhiteboardByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	whiteboardReq := &pb.WhiteboardIDRequest{
		WhiteboardId: id,
	}
	whiteboardRes, err := h.planClient.GetWhiteboardByID(context.Background(), whiteboardReq)
	if err != nil || !whiteboardRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get whiteboard by id: " + err.Error()},
		)
	}

	pinReq := &pb.ManyPinIDRequest{
		Pins: whiteboardRes.GetPins(),
	}
	pinRes, err := h.planClient.GetPinsByWhiteboard(context.Background(), pinReq)

	return ctx.Status(fiber.StatusOK).JSON(
		entities.ResponseModel{
			Message: "success",
			Data: fiber.Map{
				"day":  whiteboardRes.GetDay(),
				"pins": pinRes,
			},
			Status: fiber.StatusOK,
		},
	)
}

func (h *HTTPHandler) UpdateWhiteboardByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	bodyData := entities.UpdatedWhiteboardModel{}
	if err := ctx.BodyParser(&bodyData); err != nil {
		return ctx.Status(fiber.StatusUnprocessableEntity).JSON(
			entities.ResponseMessage{Message: "invalid json body"},
		)
	}

	req := &pb.UpdateWhiteboardRequest{
		Id:            id,
		Pins:          bodyData.Pins,
		PinChangeType: bodyData.PinsChangeType,
		Day:           int32(bodyData.Day),
	}

	res, err := h.planClient.UpdateWhiteboard(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot update whiteboard: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}

func (h *HTTPHandler) DeleteWhiteboardByID(ctx *fiber.Ctx) error {
	id := ctx.Query("id")
	if id == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(
			entities.ResponseMessage{Message: "missing or empty 'id' query parameter"},
		)
	}

	getPinIDReq := &pb.WhiteboardIDRequest{
		WhiteboardId: id,
	}
	getPinIDRes, err := h.planClient.GetWhiteboardByID(context.Background(), getPinIDReq)
	if err != nil || !getPinIDRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot get pinID by GetWhiteboardByID: " + err.Error()},
		)
	}

	deletePinsReq := &pb.ManyPinIDRequest{
		Pins: getPinIDRes.GetPins(),
	}
	deletePinIDRes, err := h.planClient.DeletePinByWhiteboard(context.Background(), deletePinsReq)
	if err != nil || !deletePinIDRes.GetSuccess() {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot delete many pin by whiteboardID: " + err.Error()},
		)
	}

	req := &pb.WhiteboardIDRequest{
		WhiteboardId: id,
	}
	res, err := h.planClient.DeleteWhiteboardByID(context.Background(), req)
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(
			entities.ResponseMessage{Message: "cannot delete whiteboard: " + err.Error()},
		)
	}

	return ctx.Status(fiber.StatusOK).JSON(res)
}
