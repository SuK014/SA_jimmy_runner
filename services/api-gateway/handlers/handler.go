package handlers

import (
	"log"

	pbPlan "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"
	pbUser "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
)

// HTTPHandler holds the gRPC client
type HTTPHandler struct {
	userClient pbUser.UserServiceClient
	planClient pbPlan.PlansServiceClient
}

// NewHTTPHandler initializes the gRPC client and returns the handler
func NewHTTPHandler(app *fiber.App, grpcAddress string) *HTTPHandler {
	conn, err := grpc.Dial(grpcAddress, grpc.WithInsecure()) // use WithTransportCredentials for TLS in production
	if err != nil {
		log.Fatalf("failed to connect to gRPC server: %v", err)
	}

	user_client := pbUser.NewUserServiceClient(conn)
	plan_client := pbPlan.NewPlansServiceClient(conn)
	handler := &HTTPHandler{
		userClient: user_client,
		planClient: plan_client,
	}
	HandlerUsers(*handler, app)
	HandlerPlans(*handler, app)
	return &HTTPHandler{
		userClient: user_client,
		planClient: plan_client,
	}
}
