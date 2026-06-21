export async function sendPush(
  expoPushToken: string,
  title: string,
  body: string
) {
  if (!expoPushToken) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
    }),
  });
}
