export const apiHandler = async (
  url: string,
  method: string,
  contentType: string,
  body: { [key: string]: string | string[] }
) => {
  const options: {
    method: string;
    headers: {
      Authorization: string;
      "Content-Type": string;
    };
    body?: string;
  } = {
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
