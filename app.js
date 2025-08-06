document.addEventListener("DOMContentLoaded", () => {
    const clientId = "8zlcy900pkkks00j7qd2pmu6z0edqr";
    // const redirectUri = "http://localhost:8000";
    const redirectUri = "https://isaiahpapa.github.io/channel-point-api-test"
    const scope = "channel:read:redemptions";

    const resultsElement = document.getElementById("results");
    const loginButton = document.getElementById("login-button");

    // Construct the Twitch authentication URL
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=token&scope=${scope}`;
    loginButton.href = authUrl;

    // --- MAIN LOGIC ---
    // Check if we have an access token in the URL fragment from the redirect
    if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get("access_token");

        if (accessToken) {
            loginButton.style.display = "none";
            resultsElement.textContent = "Token found! Checking API status...";
            checkChannelPointsStatus(accessToken);
        }
    }

    async function checkChannelPointsStatus(token) {
        try {
            // Step 1: We need the user's ID. Get it from the /users endpoint.
            const userResponse = await fetch("https://api.twitch.tv/helix/users", {
                headers: {
                    "Client-Id": clientId,
                    Authorization: `Bearer ${token}`,
                },
            });
            const userData = await userResponse.json();
            const userId = userData.data[0].id;
            const userLogin = userData.data[0].login;

            resultsElement.textContent = `User: ${userLogin} (${userId})\nBroadcaster Type: ${userData.data[0].broadcaster_type}\n\nFetching Channel Points status...`;

            // Step 2: Now, make the actual call to the channel points endpoint.
            const rewardsResponse = await fetch(
                `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${userId}`,
                {
                    headers: {
                        "Client-Id": clientId,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Read the body to display it later
            const responseBody = await rewardsResponse.json();

            // Display the crucial information!
            resultsElement.textContent = `API Check Complete!\n\n` +
                `--- RESULTS ---\n` +
                `Status Code: ${rewardsResponse.status}\n` +
                `Status Text: ${rewardsResponse.statusText}\n\n` +
                `--- RESPONSE BODY ---\n` +
                `${JSON.stringify(responseBody, null, 2)}`;

        } catch (error) {
            resultsElement.textContent = `An error occurred:\n\n${error.toString()}`;
        }
    }
});