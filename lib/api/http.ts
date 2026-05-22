import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function created<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown): NextResponse<ApiErrorBody> {
  return errorResponse("bad_request", message, 400, details);
}

export function unauthorized(message = "Authentication is required."): NextResponse<ApiErrorBody> {
  return errorResponse("unauthorized", message, 401);
}

export function notFound(message = "Resource not found."): NextResponse<ApiErrorBody> {
  return errorResponse("not_found", message, 404);
}

export function serverError(message = "Unexpected server error.", details?: unknown): NextResponse<ApiErrorBody> {
  return errorResponse("server_error", message, 500, details);
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function requiredSearchParam(request: Request, name: string): string {
  const value = new URL(request.url).searchParams.get(name);
  if (!value) {
    throw new Error(`Missing required search param: ${name}.`);
  }

  return value;
}
