import type { NextApiRequest, NextApiResponse } from "next";

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, inviterName, documentName, inviteLink } = req.body;

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
      name: email.split("@")[0], // Use the part before @ as the nam
      reply: "support@starterslab.co",
    }),
  };

  try {
    const response = await fetch("https://api.useplunk.com/v1/send", options);
    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ message: "Invitation sent successfully" });
    } else {
      console.log(data);
      res
        .status(response.status)
        .json({ message: "Failed to send invitation", error: data });
    }
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
