import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, inviterName, documentName, inviteLink } = body;

    const emailTemplate = `
      <html>
        <body>
          <h1>You've been invited to collaborate!</h1>
          <p>Hello,</p>
          <p>${inviterName} has invited you to collaborate on the document "${documentName}".</p>
          <p>Click the link below to accept the invitation and start collaborating:</p>
          <a href="${inviteLink}">Accept Invitation</a>
          <p>If you don't have an account, you'll be able to create one after clicking the link.</p>
          <p>Happy collaborating!</p>
        </body>
      </html>
    `;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `Invitation to collaborate on "${documentName}"`,
        body: emailTemplate,
        subscribed: true,
        name: email.split("@")[0], // Use the part before @ as the name
        reply: "support@starterslab.co",
      }),
    };

    const response = await fetch("https://api.useplunk.com/v1/send", options);
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({ message: "Invitation sent successfully" });
    } else {
      return NextResponse.json(
        { message: "Failed to send invitation", error: data },
        { status: response.status }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Internal server error", error: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        {
          message: "Internal server error",
          error: "An unknown error occurred",
        },
        { status: 500 }
      );
    }
  }
}
