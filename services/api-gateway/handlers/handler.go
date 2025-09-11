package handlers

import (
	"log"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/grpc"
)

// HTTPHandler holds the gRPC client
type HTTPHandler struct {
	Client pb.UserServiceClient
}

// NewHTTPHandler initializes the gRPC client and returns the handler
func NewHTTPHandler(app *fiber.App, grpcAddress string) *HTTPHandler {
	conn, err := grpc.Dial(grpcAddress, grpc.WithInsecure()) // use WithTransportCredentials for TLS in production
	if err != nil {
		log.Fatalf("failed to connect to gRPC server: %v", err)
	}

	client := pb.NewUserServiceClient(conn)
	handler := &HTTPHandler{Client: client}
	HandlerUsers(*handler, app)
	return &HTTPHandler{Client: client}
}
