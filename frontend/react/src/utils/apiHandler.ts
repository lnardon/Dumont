/* eslint-disable @typescript-eslint/no-explicit-any */
export const apiHandler = async (
  url: string,
  method: string,
  contentType: string,
  body: any
) => {
  const options: any = {
    method: method,
    headers: {
      Authorization: sessionStorage.getItem("token") || "",
      "Content-Type": contentType,
    },
  };

  if (method === "POST") {
    options.body = JSON.stringify(body);
  }

  const raw = await fetch(url, options);

  if (raw.status === 401) {
    sessionStorage.removeItem("token");
    window.location.href = "/";
  }

  return raw;
};
