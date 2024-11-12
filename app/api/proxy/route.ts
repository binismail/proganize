import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // We extract client IP address here
        const ip = request.headers.get("x-real-ip") ||
            request.headers.get("x-forwarded-for");

        // If the IP address is not found, we return an error
        if (!ip) {
            return NextResponse.json(
                { error: "Unable to determine IP address" },
                { status: 400 },
            );
        }

        // calling api.ipapi API to get the location data based on IP address
        const locationResponse = await fetch(
            `http://api.ipapi.com/${ip}?access_key=${process.env.IPAPI_KEY}&format=1`,
        );
        const locationData = await locationResponse.json();
        return NextResponse.json(locationData);
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
