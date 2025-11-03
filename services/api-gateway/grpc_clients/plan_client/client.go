package planclient

import (
	"context"
	// "os"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/plan"
	"google.golang.org/grpc"
	// "google.golang.org/grpc/credentials/insecure"
)

type PlansServiceClient struct {
	Client pb.PlansServiceClient
	conn   *grpc.ClientConn
}

// func NewPlansServiceClient() (*PlansServiceClient, error) {
// 	planServiceURL := os.Getenv("PLAN_SERVICE_URL")
// 	if planServiceURL == "" {
// 		planServiceURL = "localhost:8081"
// 	}

// 	conn, err := grpc.NewClient(planServiceURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
// 	if err != nil {
// 		return nil, err
// 	}

// 	client := pb.NewPlansServiceClient(conn)
// 	return &PlansServiceClient{
// 		Client: client,
// 		conn:   conn,
// 	}, nil
// }

func (ds *PlansServiceClient) Close() {
	if ds.conn != nil {
		err := ds.conn.Close()
		if err != nil {
			return
		}
	}
}

func (ds *PlansServiceClient) CreateUser(ctx context.Context, req *pb.CreatePinRequest) (*pb.CreatePinResponse, error) {
	return ds.Client.CreatePin(ctx, req)
}

func (ds *PlansServiceClient) GetPinByID(ctx context.Context, req *pb.PinIDRequest) (*pb.GetPinByIDResponse, error) {
	return ds.Client.GetPinByID(ctx, req)
}

func (ds *PlansServiceClient) GetPinByParticipant(ctx context.Context, req *pb.GetPinByParticipantRequest) (*pb.GetPinsResponse, error) {
	return ds.Client.GetPinByParticipant(ctx, req)
}

func (ds *PlansServiceClient) UpdatePin(ctx context.Context, req *pb.UpdatePinRequest) (*pb.SuccessResponse, error) {
	return ds.Client.UpdatePin(ctx, req)
}

func (ds *PlansServiceClient) UpdatePinImage(ctx context.Context, req *pb.UpdatePinImageRequest) (*pb.SuccessResponse, error) {
	return ds.Client.UpdatePinImage(ctx, req)
}

func (ds *PlansServiceClient) DeletePinByID(ctx context.Context, req *pb.PinIDRequest) (*pb.SuccessResponse, error) {
	return ds.Client.DeletePinByID(ctx, req)
}
