import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// === Custom metrics ===
const errorRate = new Rate("errors");

// === Stress Test Configuration ===
// Gradually increase load beyond normal capacity to find breaking point
export const options = {
    stages: [
        { duration: "2m", target: 50 }, // Ramp up to baseline (50 users)
        { duration: "3m", target: 100 }, // Increase to 100 users
        { duration: "3m", target: 150 }, // Push to 150 users
        { duration: "3m", target: 200 }, // Stress at 200 users
        { duration: "2m", target: 250 }, // Maximum stress (250 users)
        { duration: "3m", target: 0 }, // Gradual ramp down
    ],
    thresholds: {
        http_req_duration: ["p(95)<5000"], // Allow slower response under stress
        errors: ["rate<0.3"], // Allow up to 30% errors under extreme stress
    },
};

// === Base URL ===
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// === Setup ===
export function setup() {
    const email = `stresstest_${Date.now()}@example.com`;
    const password = "TestPassword123!";

    const registerRes = http.post(
        `${BASE_URL}/users/register`,
        JSON.stringify({
            name: "Stress Test User",
            email,
            password,
        }),
        { headers: { "Content-Type": "application/json" } }
    );

    const success = check(registerRes, {
        "setup: registration successful": (r) => r.status === 200,
    });

    if (!success) {
        console.error(
            `❌ Registration failed | status=${registerRes.status} | body=${registerRes.body}`
        );
    }

    const cookies = registerRes.cookies;
    const token = cookies.cookies ? cookies.cookies[0].value : null;

    if (!token) {
        console.error(
            `❌ No token found in cookies | cookies=${JSON.stringify(cookies)}`
        );
    }

    return {
        email,
        password,
        token,
        userId: registerRes.json("user_id"),
    };
}

// === Main test logic ===
export default function (data) {
    const rnd = Math.random();

    if (rnd < 0.2) testLogin(data);
    else if (rnd < 0.5) testTripOperations(data);
    else if (rnd < 0.8) testPinOperations(data);
    else testCollaborationOperations(data);

    sleep(1);
}

// === Scenarios ===

function testLogin(data) {
    const res = http.post(
        `${BASE_URL}/users/login`,
        JSON.stringify({ email: data.email, password: data.password }),
        { headers: { "Content-Type": "application/json" } }
    );

    const success = check(res, {
        "login: status is 200": (r) => r.status === 200,
        "login: has user_id": (r) => r.json("user_id") !== undefined,
    });

    if (!success) {
        console.error(
            `❌ Login failed | status=${res.status} | body=${res.body}`
        );
    }

    errorRate.add(!success);
}

function testTripOperations(data) {
    const headers = {
        "Content-Type": "application/json",
        Cookie: `cookies=${data.token}`,
    };

    // --- Create Trip ---
    const createRes = http.post(
        `${BASE_URL}/plan/trip/`,
        JSON.stringify({
            name: `Stress Test Trip ${Date.now()}`,
            description: "This is a stress test trip",
        }),
        { headers }
    );

    const createSuccess = check(createRes, {
        "create trip: status is 200": (r) => r.status === 200,
        "create trip: has TripId": (r) => r.json("TripId") !== undefined,
    });

    if (!createSuccess) {
        console.error(
            `❌ Create trip failed | status=${createRes.status} | body=${createRes.body}`
        );
    }

    errorRate.add(!createSuccess);

    if (!createSuccess) return;
    const tripId = createRes.json("TripId");

    // --- View Trip ---
    const viewRes = http.get(`${BASE_URL}/plan/trip/?id=${tripId}`, {
        headers,
    });
    const viewSuccess = check(viewRes, {
        "view trip: status is 200": (r) => r.status === 200,
    });

    if (!viewSuccess) {
        console.error(
            `❌ View trip failed | status=${viewRes.status} | body=${viewRes.body}`
        );
    }

    errorRate.add(!viewSuccess);
    sleep(0.3);

    // --- Update Trip ---
    const updateRes = http.put(
        `${BASE_URL}/plan/trip/?id=${tripId}`,
        JSON.stringify({
            name: `Updated Stress Trip ${Date.now()}`,
            description: "Updated under stress",
        }),
        { headers }
    );

    const updateSuccess = check(updateRes, {
        "update trip: status is 200": (r) => r.status === 200,
    });
    if (!updateSuccess) {
        console.error(
            `❌ Update trip failed | status=${updateRes.status} | body=${updateRes.body}`
        );
    }

    errorRate.add(!updateSuccess);
    sleep(0.3);

    // --- Delete Trip ---
    const deleteRes = http.del(`${BASE_URL}/plan/trip/?id=${tripId}`, null, {
        headers,
    });
    const deleteSuccess = check(deleteRes, {
        "delete trip: status is 200": (r) => r.status === 200,
    });

    if (!deleteSuccess) {
        console.error(
            `❌ Delete trip failed | status=${deleteRes.status} | body=${deleteRes.body}`
        );
    }

    errorRate.add(!deleteSuccess);
}

function testPinOperations(data) {
    const headers = {
        "Content-Type": "application/json",
        Cookie: `cookies=${data.token}`,
    };

    // Create Trip for Pins
    const tripRes = http.post(
        `${BASE_URL}/plan/trip/`,
        JSON.stringify({
            name: `Pin Stress Trip ${Date.now()}`,
            description: "Trip for pin stress testing",
        }),
        { headers }
    );

    if (tripRes.status !== 200) {
        console.error(
            `❌ Create trip (for pin) failed | status=${tripRes.status} | body=${tripRes.body}`
        );
        errorRate.add(true);
        return;
    }

    const tripId = tripRes.json("TripId");

    // Get Trip to find whiteboard ID
    const getRes = http.get(`${BASE_URL}/plan/trip/?id=${tripId}`, { headers });
    if (getRes.status !== 200) {
        console.error(
            `❌ Get trip (for pin) failed | status=${getRes.status} | body=${getRes.body}`
        );
        errorRate.add(true);
        return;
    }

    const responseData = getRes.json("data");
    const tripData = responseData ? responseData.trip : null;
    const whiteboards = tripData ? tripData.whiteboards : null;

    if (!whiteboards || whiteboards.length === 0) {
        console.error(
            `❌ No whiteboard found for trip_id=${tripId} | response=${getRes.body}`
        );
        errorRate.add(true);
        return;
    }

    const whiteboardId = whiteboards[0];

    // --- Create Pin ---
    const pinRes = http.post(
        `${BASE_URL}/plan/pin/?whiteboard_id=${whiteboardId}`,
        JSON.stringify({
            name: "Stress Test Location",
            description: "Testing under stress",
            location: 1,
            expenses: [{ id: data.userId, name: "User", expense: 1000 }],
            participants: [data.userId],
        }),
        { headers }
    );

    const pinSuccess = check(pinRes, {
        "create pin: status is 200": (r) => r.status === 200,
        "create pin: has pinId": (r) => r.json("pinId") !== undefined,
    });
    if (!pinSuccess) {
        console.error(
            `❌ Create pin failed | status=${pinRes.status} | body=${pinRes.body}`
        );
    }

    errorRate.add(!pinSuccess);
    if (!pinSuccess) return;

    const pinId = pinRes.json("pinId");
    sleep(0.2);

    // --- View Pin ---
    const viewPinRes = http.get(`${BASE_URL}/plan/pin/?id=${pinId}`, {
        headers,
    });
    if (viewPinRes.status !== 200) {
        console.error(
            `❌ View pin failed | status=${viewPinRes.status} | body=${viewPinRes.body}`
        );
    }
    errorRate.add(viewPinRes.status !== 200);

    sleep(0.2);

    // --- Update Pin ---
    const updatePinRes = http.put(
        `${BASE_URL}/plan/pin/?id=${pinId}`,
        JSON.stringify({
            name: "Stress Test Location - Updated",
            description: "Updated under stress",
        }),
        { headers }
    );

    if (updatePinRes.status !== 200) {
        console.error(
            `❌ Update pin failed | status=${updatePinRes.status} | body=${updatePinRes.body}`
        );
    }
    errorRate.add(updatePinRes.status !== 200);

    // Cleanup
    http.del(`${BASE_URL}/plan/trip/?id=${tripId}`, null, { headers });
}

function testCollaborationOperations(data) {
    const headers = {
        "Content-Type": "application/json",
        Cookie: `cookies=${data.token}`,
    };

    // --- Get Profile ---
    const profileRes = http.get(`${BASE_URL}/users/`, { headers });
    if (profileRes.status !== 200) {
        console.error(
            `❌ Get profile failed | status=${profileRes.status} | body=${profileRes.body}`
        );
    }
    errorRate.add(profileRes.status !== 200);

    sleep(0.2);

    // --- Get Trips ---
    const tripsRes = http.get(`${BASE_URL}/userTrip/trips`, { headers });
    if (tripsRes.status !== 200) {
        console.error(
            `❌ Get trips failed | status=${tripsRes.status} | body=${tripsRes.body}`
        );
    }
    errorRate.add(tripsRes.status !== 200);
}

// === Teardown ===
export function teardown(data) {
    console.log("✅ Stress test completed. Check results for breaking point.");
}
