package userclient

import (
	"context"
	// "os"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"google.golang.org/grpc"
	// "google.golang.org/grpc/credentials/insecure"
)

type UserServiceClient struct {
	Client pb.UserServiceClient
	conn   *grpc.ClientConn
}

// func NewUserServiceClient() (*UserServiceClient, error) {
// 	userServiceURL := os.Getenv("USER_SERVICE_URL")
// 	if userServiceURL == "" {
// 		userServiceURL = "localhost:8080"
// 	}

// 	conn, err := grpc.NewClient(userServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
// 	if err != nil {
// 		return nil, err
// 	}

// 	client := pb.NewUserServiceClient(conn)
// 	return &UserServiceClient{
// 		Client: client,
// 		conn:   conn,
// 	}, nil
// }

func (ds *UserServiceClient) Close() {
	if ds.conn != nil {
		err := ds.conn.Close()
		if err != nil {
			return
		}
	}
}

func (ds *UserServiceClient) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	return ds.Client.CreateUser(ctx, req)
}

func (ds *UserServiceClient) LoginUser(ctx context.Context, req *pb.LoginUserRequest) (*pb.UserResponse, error) {
	return ds.Client.LoginUser(ctx, req)
}

func (ds *UserServiceClient) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	return ds.Client.UpdateUser(ctx, req)
}
