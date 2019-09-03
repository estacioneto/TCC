export class HttpClient {
  baseUrl = '';

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.endsWith('/')
      ? baseUrl.substr(0, baseUrl.length - 1)
      : baseUrl;
  }

  async get<T>(
    endpoint: string = '',
    options?: Partial<RequestInit>
  ): Promise<T> {
    return (await fetch(
      `${this.baseUrl}/${
        endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
      }`,
      options
    )).json();
  }
}
