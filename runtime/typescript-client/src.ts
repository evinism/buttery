interface SurClientConfig {}

class SurClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  baseUrl: string;
  surpcApiNamespace = "sur-api";

  request<A, T>(requestName: string, requestValue: A): Promise<T> {
    // TODO: Validation
    const targetUrl = `${this.baseUrl}/${this.surpcApiNamespace}/${requestName}`;
    return fetch(targetUrl, {
      method: "post",
      body: JSON.stringify(requestValue),
    }).then((response) => response.json());
  }
}
