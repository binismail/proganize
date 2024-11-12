import { NextRequest } from "next/server";

const middleware = (request: NextRequest) => {
    console.log("request is ", request);
};

export default middleware;
