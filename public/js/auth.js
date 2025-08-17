document.addEventListener("auth-success", async (event) => {
    const { code, state } = event.detail;

    try {
        const response = await fetch("/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state })
        });

        if (response.ok) {
            window.location.href = "/";
        } else {
            console.error("Auth callback failed");
        }
    } catch (error) {
        console.error("Auth error:", error);
    }
});

document.addEventListener("auth-error", (event) => {
    console.error("Auth error:", event.detail);
});