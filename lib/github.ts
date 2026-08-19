import jwt from "jsonwebtoken";

export async function getInstallationToken(
  installationId: string
) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are missing");
  }

  const appJwt = jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 10 * 60,
      iss: appId,
    },
    privateKey,
    {
      algorithm: "RS256",
    }
  );

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create GitHub installation token: ${error}`
    );
  }

  const data = await response.json();

  return data.token as string;
}