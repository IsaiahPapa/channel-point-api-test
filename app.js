document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION ---
    const clientId = "8zlcy900pkkks00j7qd2pmu6z0edqr";
    const redirectUri = "https://isaiahpapa.github.io/channel-point-api-test"
    const scope = "channel:read:redemptions user:read:email";

    const resultsElement = document.getElementById("results");
    const loginButton = document.getElementById("login-button");
    const copyButton = document.getElementById("copy-button");

    // Construct the Twitch authentication URL
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&response_type=token&scope=${encodeURIComponent(scope)}`;
    loginButton.href = authUrl;

    // --- MAIN LOGIC ---
    // Check if we have an access token in the URL fragment from the redirect
    if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get("access_token");

        if (accessToken) {
            loginButton.style.display = "none";
            resultsElement.textContent = "Token found! Running API checks...";
            runApiChecks(accessToken);
        }
    }

    async function runApiChecks(token) {
        try {
            // --- 1. Get User Information (including broadcaster_type) ---
            const userResponse = await fetch("https://api.twitch.tv/helix/users", {
                headers: {
                    "Client-Id": clientId,
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!userResponse.ok) throw new Error(`Failed to get user info: ${userResponse.status}`);
            const userData = await userResponse.json();
            const user = userData.data[0];

            // --- 2. Get Channel Points Information ---
            const rewardsResponse = await fetch(
                `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${user.id}`,
                {
                    headers: {
                        "Client-Id": clientId,
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            // We read the body regardless of status to see error messages
            const rewardsData = await rewardsResponse.json();

            // --- 3. Format a Clean Summary for Display ---
            const rewardsCount = rewardsData.data?.length ?? 0;
            let summaryText =
                `--- User Info ---\n` +
                `Login: ${user.login}\n` +
                `Display Name: ${user.display_name}\n` +
                `Broadcaster Type: '${user.broadcaster_type}' (Empty string is normal)\n` +
                `User Type: '${user.type}'\n\n` +
                `--- Channel Points API Check ---\n` +
                `Status Code: ${rewardsResponse.status}\n` +
                `Status Text: ${rewardsResponse.statusText}\n` +
                `Rewards Found: ${rewardsCount}\n\n`;

            // If there's an error message from the rewards API, include it
            if (!rewardsResponse.ok && rewardsData.message) {
                 summaryText += `API Error Message: "${rewardsData.message}"\n\n`;
            }

            // Include a sample of the first reward if one exists
            if (rewardsCount > 0) {
                const sampleReward = {
                    id: rewardsData.data[0].id,
                    title: rewardsData.data[0].title,
                    cost: rewardsData.data[0].cost,
                    is_enabled: rewardsData.data[0].is_enabled
                };
                summaryText += `--- Sample Reward (First Item) ---\n` +
                             `${JSON.stringify(sampleReward, null, 2)}`;
            }

            resultsElement.textContent = summaryText;
            copyButton.style.display = 'inline-block'; // Show the copy button

        } catch (error) {
            resultsElement.textContent = `An error occurred during the test:\n\n${error.toString()}`;
        }
    }

    // --- 4. Add Copy Button Functionality ---
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(resultsElement.textContent).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy Results'; }, 2000);
        }).catch(err => {
            console.error('Failed to copy results: ', err);
            copyButton.textContent = 'Copy Failed!';
        });
    });
});