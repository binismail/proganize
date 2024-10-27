import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, inviterName, documentName, inviteLink, logoUrl } = body;

    const emailTemplate = `
      <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo img {
            max-height: 60px;
            width: auto;
        }
        h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }
        .highlight {
            font-weight: 600;
            color: #2c3e50;
        }
        .button {
            display: inline-block;
            background-color: #0000;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #0f0e0ff0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666666;
        }
        .divider {
            border-top: 1px solid #eee;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
            <!-- Replace the src with your actual logo URL -->
            <img src="${logoUrl}" alt="Company Logo">
        </div>
        
        <h1>You've Been Invited to Collaborate on ${documentName}</h1>
        
        <p>Hello,</p>
        
        <p><span class="highlight">${inviterName}</span> has invited you to collaborate on the document "<span class="highlight">${documentName}</span>".</p>
        
        <p>Click the button below to accept the invitation and start collaborating:</p>
        
        <div style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
        </div>
        
        <p>If you don't have an account, you'll be able to create one after clicking the button.</p>
        
        <div class="divider"></div>
        
        <div class="footer">
            <p>Happy collaborating!</p>
            <p>If you need any assistance, please don't hesitate to reach out to our support team.</p>
        </div>
    </div>
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
        { status: response.status },
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Internal server error", error: error.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Internal server error",
          error: "An unknown error occurred",
        },
        { status: 500 },
      );
    }
  }
}
