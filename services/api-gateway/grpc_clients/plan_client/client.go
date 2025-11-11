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

// pins
func (ds *PlansServiceClient) CreatePin(ctx context.Context, req *pb.CreatePinRequest) (*pb.CreatePinResponse, error) {
	return ds.Client.CreatePin(ctx, req)
}

func (ds *PlansServiceClient) GetPinByID(ctx context.Context, req *pb.PinIDRequest) (*pb.GetPinByIDResponse, error) {
	return ds.Client.GetPinByID(ctx, req)
}

func (ds *PlansServiceClient) GetPinByParticipant(ctx context.Context, req *pb.GetPinByParticipantRequest) (*pb.GetPinsResponse, error) {
	return ds.Client.GetPinByParticipant(ctx, req)
}

func (ds *PlansServiceClient) GetPinsByWhiteboard(ctx context.Context, req *pb.ManyPinIDRequest) (*pb.GetPinsResponse, error) {
	return ds.Client.GetPinsByWhiteboard(ctx, req)
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

func (ds *PlansServiceClient) DeletePinByWhiteboard(ctx context.Context, req *pb.ManyPinIDRequest) (*pb.SuccessResponse, error) {
	return ds.Client.DeletePinByWhiteboard(ctx, req)
}

// whiteboards
func (ds *PlansServiceClient) CreateWhiteboard(ctx context.Context, req *pb.CreateWhiteboardRequest) (*pb.CreateWhiteboardResponse, error) {
	return ds.Client.CreateWhiteboard(ctx, req)
}

func (ds *PlansServiceClient) GetWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.GetWhiteboardByIDResponse, error) {
	return ds.Client.GetWhiteboardByID(ctx, req)
}

func (ds *PlansServiceClient) GetWhiteboardsByTrip(ctx context.Context, req *pb.ManyWhiteboardIDRequest) (*pb.GetWhiteboardsResponse, error) {
	return ds.Client.GetWhiteboardsByTrip(ctx, req)
}

func (ds *PlansServiceClient) UpdateWhiteboard(ctx context.Context, req *pb.UpdateWhiteboardRequest) (*pb.SuccessResponse, error) {
	return ds.Client.UpdateWhiteboard(ctx, req)
}

func (ds *PlansServiceClient) DeleteWhiteboardByID(ctx context.Context, req *pb.WhiteboardIDRequest) (*pb.SuccessResponse, error) {
	return ds.Client.DeleteWhiteboardByID(ctx, req)
}

func (ds *PlansServiceClient) DeleteWhiteboardByTrip(ctx context.Context, req *pb.ManyWhiteboardIDRequest) (*pb.SuccessResponse, error) {
	return ds.Client.DeleteWhiteboardByTrip(ctx, req)
}

// trips
func (ds *PlansServiceClient) CreateTrip(ctx context.Context, req *pb.CreateTripRequest) (*pb.CreateTripResponse, error) {
	return ds.Client.CreateTrip(ctx, req)
}

func (ds *PlansServiceClient) GetTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.GetTripByIDResponse, error) {
	return ds.Client.GetTripByID(ctx, req)
}

func (ds *PlansServiceClient) GetManyTripsByID(ctx context.Context, req *pb.ManyTripIDRequest) (*pb.GetTripsResponse, error) {
	return ds.Client.GetManyTripsByID(ctx, req)
}

func (ds *PlansServiceClient) UpdateTrip(ctx context.Context, req *pb.UpdateTripRequest) (*pb.SuccessResponse, error) {
	return ds.Client.UpdateTrip(ctx, req)
}

func (ds *PlansServiceClient) UpdateTripImage(ctx context.Context, req *pb.UpdateTripImageRequest) (*pb.SuccessResponse, error) {
	return ds.Client.UpdateTripImage(ctx, req)
}

func (ds *PlansServiceClient) DeleteTripByID(ctx context.Context, req *pb.TripIDRequest) (*pb.SuccessResponse, error) {
	return ds.Client.DeleteTripByID(ctx, req)
}
